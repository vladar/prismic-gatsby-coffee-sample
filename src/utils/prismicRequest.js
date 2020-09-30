import { apiEndpoint, apiRef } from "../../prismic-configuration"
import fetch from "cross-fetch"

export async function prismicRequest(query) {
  const url = new URL(apiEndpoint)
  url.search = new URLSearchParams({ query }).toString()

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Prismic-ref": apiRef,
    },
  })
  return await response.json()
}
