import React, { useState } from "react"
import { RichText } from "prismic-reactjs"
import { Link, graphql } from "gatsby"
import { Helmet } from "react-helmet"
import { linkResolver } from "../utils/linkResolver"
import Layout from "../components/layouts"
import { prismicRequest } from "../utils/prismicRequest"
import clientSideQuery from "./products.graphql"

export const query = graphql`
  {
    prismicProducts {
      ...ProductsPage_Products
    }
    allPrismicProduct {
      edges {
        node {
          ...ProductsPage_Product
        }
      }
    }
  }
`

const RenderProductList = ({ products }) => {
  return products.map(item => (
    <div key={item.node._meta.uid} className="products-grid-item-wrapper">
      <Link to={linkResolver(item.node._meta)}>
        <img
          className="products-grid-item-image"
          src={item.node.product_image.url}
          alt={item.node.product_image.alt}
        />
        <p className="products-grid-item-name">
          {RichText.asText(item.node.product_name)}
        </p>
      </Link>
      <p className="products-grid-item-subtitle">
        {RichText.asText(item.node.sub_title)}
      </p>
    </div>
  ))
}

const RenderBody = ({ productHome, products }) => {
  const [usedProducts, setProducts] = useState(products)

  const handleReload = async () => {
    const result = await prismicRequest(clientSideQuery)
    console.log(
      `Loaded ${result.data.allProducts.edges.length} products`,
      result.data.allProducts.edges
    )
    setProducts(result.data.allProducts.edges)
  }

  return (
    <React.Fragment>
      <div className="l-wrapper">
        <hr className="separator-hr" />
      </div>

      <section className="products-section">
        <div className="l-wrapper">
          <header className="products-grid-header">
            <div className="products-grid-header-title">
              {RichText.render(productHome.title, linkResolver)}
            </div>
            <button onClick={handleReload} className="a-button">
              Reload
            </button>
          </header>
        </div>
        <div className="products-grid-items-wrapper">
          <RenderProductList products={usedProducts} />
        </div>
      </section>

      <div data-wio-id={productHome._meta.id}></div>
    </React.Fragment>
  )
}

export default ({ data }) => {
  const doc = data.prismicProducts
  if (!doc) return null

  return (
    <Layout>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{RichText.asText(doc.title)}</title>
      </Helmet>
      <RenderBody
        productHome={doc}
        products={data.allPrismicProduct.edges.slice(0, 1)}
      />
    </Layout>
  )
}
