import { Html, Head, Main, NextScript } from 'next/document';
import { variantsHeadScript } from '@gxpl/sdk';

export default function Document() {
  return (
    <Html>
      <Head>
        {/*
          Page variants (`?gx_v=<value>`). This picks the variant before the first paint,
          so it must stay inline and synchronous; it sets one attribute on <html> and
          touches nothing React hydrates. The rules that react to it come with the page.
        */}
        <script dangerouslySetInnerHTML={{ __html: variantsHeadScript }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
