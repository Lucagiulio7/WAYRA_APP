import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * HTML root per il build web (Netlify).
 * Carica il font Ionicons da CDN per garantire la visualizzazione delle icone.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
        {/* Preload Ionicons – evita il FOUT (flash of unstyled text) */}
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.0.3/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        {/* Preload BebasNeue da Google Fonts */}
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Ionicons – font icone vettoriali */
            @font-face {
              font-family: 'Ionicons';
              src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.0.3/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype');
              font-weight: normal;
              font-style: normal;
              font-display: block;
            }
            /* BebasNeue – logo WAYRA (fallback CSS se useFonts è lento) */
            @font-face {
              font-family: 'BebasNeue_400Regular';
              src: url('https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXooxW5rygbi49c.woff2') format('woff2');
              font-weight: 400;
              font-style: normal;
              font-display: block;
            }
            body {
              background-color: #0f0f1e;
            }
            /* Centra e limita la larghezza su desktop */
            #root > div {
              max-width: 480px;
              margin: 0 auto;
            }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
