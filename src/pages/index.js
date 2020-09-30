import React from "react"
import { RichText } from "prismic-reactjs"
import { linkResolver } from "../utils/linkResolver"
import { graphql } from "gatsby"
import {
  CTABanner,
  FeaturedItems,
  NumberedItems,
  Separator,
  TextBlock,
} from "../components/slices"

import Layout from "../components/layouts"

export const query = graphql`
  {
    prismicHomepage {
      ...Homepage
    }
  }
`

const RenderSlices = ({ slices }) => {
  return slices.map((slice, index) => {
    const res = (() => {
      switch (slice.type) {
        case "cta_banner":
          return (
            <div key={index} className="homepage-slice-wrapper">
              <CTABanner slice={slice} />
            </div>
          )

        case "featured_items":
          return (
            <div key={index} className="homepage-slice-wrapper">
              <FeaturedItems slice={slice} />
            </div>
          )

        case "big_bullet_item":
          return (
            <div key={index} className="homepage-slice-wrapper">
              <NumberedItems slice={slice} />
            </div>
          )

        case "separator":
          return (
            <div key={index} className="homepage-slice-wrapper">
              <Separator />
            </div>
          )

        case "text_block":
          return (
            <div key={index} className="homepage-slice-wrapper">
              <TextBlock slice={slice} />
            </div>
          )

        default:
          return
      }
    })()
    return res
  })
}

const RenderBody = ({ home }) => (
  <React.Fragment>
    <header className="homepage-header">
      <div className="l-wrapper">
        <div className="homepage-header-title">
          {RichText.render(home.title, linkResolver)}
        </div>
      </div>
    </header>

    <section className="homepage-banner">
      <img
        className="homepage-banner-image"
        src={home.banner_image.url}
        alt={home.banner_image.alt}
      />
      <div className="homepage-banner-box-wrapper">
        <div className="homepage-banner-box">
          {RichText.render(home.banner_text, linkResolver)}
        </div>
      </div>
    </section>

    <div className="homepage-slices-wrapper">
      <RenderSlices slices={home.body} />
    </div>
  </React.Fragment>
)

export default ({ data }) => {
  // Required check for no data being returned
  const doc = data.prismicHomepage
  if (!doc) return null

  return (
    <Layout>
      <RenderBody home={doc} />
    </Layout>
  )
}
