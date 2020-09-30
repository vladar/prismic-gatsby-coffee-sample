## What is this
This is a direct port of this [prismic example project][1] from `gatsby-source-prismic-graphql` to
[gatsby-graphql-source-toolkit][2].

The goal of this experiment is to demonstrate how to re-use parts of GraphQL
queries in Gatsby builds and Prismic client-side queries (using fragments)

## Demo

1. Fill in `apiEndpoint` and `apiRef` in [prismic-configuration.js](./prismic-configuration.js)

2. Build this site with `gatsby develop` and open in a browser. 

3. Go to "products" page. It will display a single product built by Gatsby (intentionally).

4. Hit "reload" button. It will trigger client-side GraphQL query to Prismic GraphQL endpoint and
   refresh all products dynamically.

The nice part is that this client-side query uses the same fragments as Gatsby
page query.

In theory it should be possible to implement Prismic live previews this way.

## How it works

Parts of graphql queries from [original example][1] were moved to fragments.
We use those fragments with [gatsby-graphql-source-toolkit][2] to source data from Prismic to Gatsby.

**Important note**: fragments are authored against Prismic GraphQL schema,
not Gatsby schema (so they can be tested directly in Prismic GraphiQL).

We transform those Prismic fragments to Gatsby fragments dynamically using
[`compileGatsbyFragments`][3] feature of the toolkit.

This way we can use the same fragments in Gatsby page queries by name.

This all happens in [`gatsby-node.js`](./gatsby-node.js).

The client-side query simply uses `cross-fetch` but it should be possible to
integrate it with apollo as well (e.g. using [babel-plugin-import-graphql][4] or [webpack-graphql-loader][5]) 

## Caveats

[`compileGatsbyFragments`][3] is an experimental feature of the toolkit.
There are definitely some bugs and inconsistencies. Don't hesitate to open 
an issue in the [toolkit repo][2] if you discover one.

[1]: https://github.com/prismicio/prismic-gatsby-coffee-sample
[2]: https://github.com/gatsbyjs/gatsby-graphql-toolkit
[3]: https://github.com/gatsbyjs/gatsby-graphql-toolkit#compilegatsbyfragments
[4]: https://github.com/detrohutt/babel-plugin-import-graphql
[5]: https://www.npmjs.com/package/webpack-graphql-loader
