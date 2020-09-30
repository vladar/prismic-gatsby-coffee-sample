const {
  sourceAllNodes,
  createSchemaCustomization,
  compileNodeQueries,
  compileGatsbyFragments,
  buildNodeDefinitions,
  loadSchema,
  wrapQueryExecutorWithQueue,
} = require(`gatsby-graphql-source-toolkit`)

const fetch = require(`cross-fetch`)
const glob = require(`glob`)

const { print } = require(`gatsby/graphql`)
const fs = require(`fs-extra`)

const debugDir = __dirname + `/.cache/prismic-compiled-queries`
const gatsbyTypePrefix = `Prismic`
const gatsbyFragments =
  __dirname + `/.cache/fragments/prismic-gatsby-fragments.js`

async function writeCompiledQueries(nodeDocs) {
  await fs.ensureDir(debugDir)
  for (const [remoteTypeName, document] of nodeDocs) {
    await fs.writeFile(debugDir + `/${remoteTypeName}.graphql`, print(document))
  }
}

async function writeGatsbyFragments(fragmentsDoc) {
  const renderFragment = def => `
export const ${def.name.value} = graphql\`
  ${print(def)}
\``

const text = `
/* eslint-disable */
import { graphql } from "gatsby"

${fragmentsDoc.definitions.map(renderFragment).join(`\n\n`)}
`

  await fs.writeFileSync(gatsbyFragments, text)
}

async function executeGraphQLQuery({ operationName, query, variables }) {
  if (!process.env.PRISMIC_GRAPHQL_ENDPOINT) {
    throw new Error("Missing process.env.PRISMIC_GRAPHQL_ENDPOINT")
  }
  if (!process.env.PRISMIC_REF) {
    throw new Error("Missing process.env.PRISMIC_REF")
  }
  console.log(operationName, variables)

  const url = new URL(process.env.PRISMIC_GRAPHQL_ENDPOINT)
  url.search = new URLSearchParams({
    operationName,
    query,
    variables,
  }).toString()

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Prismic-ref": process.env.PRISMIC_REF,
    },
    query: {
      query,
      operationName,
      variables,
    },
  })
  const result = await response.json()

  if (result.data && result.errors) {
    result.errors.forEach(err => {
      console.warn(err.message)
    })
  }

  return result
}

async function createSourcingConfig(gatsbyApi) {
  // Step1. Setup remote schema:
  const execute = wrapQueryExecutorWithQueue(executeGraphQLQuery)
  const schema = await loadSchema(execute)

  const docInterface = schema.getType(`_Document`)
  const possibleTypes = schema.getPossibleTypes(docInterface)

  const gatsbyNodeTypes = possibleTypes.map(type => ({
    remoteTypeName: type.name,
    queries: `
      query LIST_${type.name} {
        _allDocuments (type: "${type.name.toLowerCase()}", first: $first, after: $after) {
          edges {
            node {
              ..._${type.name}Id_
            }
          }
        }
      }
      fragment _${type.name}Id_ on ${type.name} {
        _meta { id }
      }
    `,
  }))

  // Step3. Provide (or generate) fragments with fields to be fetched
  const fragments = glob
    .sync(`${__dirname}/src/**/*.fragment.graphql`)
    .map(path => fs.readFileSync(path).toString())
    .concat([
      // Make sure all needed meta fields are always sourced for every document:
      `fragment _DocumentMetaFragment_ on _Document { _meta { uid } }`
    ])

  const gatsbyFragmentsDocument = compileGatsbyFragments({
    schema,
    gatsbyNodeTypes,
    gatsbyTypePrefix,
    customFragments: fragments,
  })

  // Write Gatsby fragments (can be used in Gatsby queries)
  await writeGatsbyFragments(gatsbyFragmentsDocument)

  // Step4. Compile sourcing queries
  const documents = compileNodeQueries({
    schema,
    gatsbyNodeTypes,
    customFragments: fragments,
  })

  // Write compiled queries (for debugging only)
  await writeCompiledQueries(documents)

  return {
    gatsbyApi,
    schema,
    execute,
    gatsbyTypePrefix,
    gatsbyNodeDefs: buildNodeDefinitions({ gatsbyNodeTypes, documents }),
  }
}

exports.sourceNodes = async (gatsbyApi, pluginOptions) => {
  const config = await createSourcingConfig(gatsbyApi)

  // Step5. Add explicit types to gatsby schema
  await createSchemaCustomization(config)

  // Step6. Source nodes
  await sourceAllNodes(config)
}

exports.createPages = async ({ actions, graphql }) => {
  const { data } = await graphql(`
    {
      allPrismicProduct {
        nodes { _meta { uid } }
      }
      allPrismicBlogPost {
        nodes { _meta { uid } }
      }
    }
  `)

  data.allPrismicProduct.nodes.forEach(node => {
    actions.createPage({
      path: `/products/${node._meta.uid}`,
      component: require.resolve('./src/templates/product.js'),
      context: {
        uid: node._meta.uid
      }
    })
  })

  data.allPrismicBlogPost.nodes.forEach(node => {
    actions.createPage({
      path: `/blog/${node._meta.uid}`,
      component: require.resolve('./src/templates/blogPost.js'),
      context: {
        uid: node._meta.uid
      }
    })
  })
}
