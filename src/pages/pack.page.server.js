import axios from "axios";

export async function onBeforeRender(pageContext) {
  const response = await axios.get("https://backend.yituliu.site/store/pack/");
  const data = await response.data.data;
  const pageProps = { data };
  return {
    pageContext: {
      pageProps,
    },
  };
}
