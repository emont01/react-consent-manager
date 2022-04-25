import reactRefresh from '@vitejs/plugin-react-refresh'
import { brotliDecompress } from 'zlib'
import 'dotenv/config'

/**
 * https://vitejs.dev/config/
 * @type { import('vite').UserConfig }
 */
export default {
  plugins: [reactRefresh()],
  server: {
    host: '127.0.01',
    //hmr: {
    //  port: 443,
    //},
    proxy: {
      '^/segment/cdn/.*': {
        target: 'https://cdn.segment.com/analytics.js/v1/BLEe1MYMmpXFAZaEKk6jMLsGyqGGePWq',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/segment\/cdn/, ''),
        selfHandleResponse: true, // required for proxy response changes to work
        configure: (proxy, options) => {
          ////////////////////////////////////////////////////////////////////////////////////////////////////////////
          //HACK: force analytics to call localhost /segment/api instead of the actual URL by replacing apiHost value
          ////////////////////////////////////////////////////////////////////////////////////////////////////////////
          proxy.on('proxyRes', function (proxyRes, req, res) {
            //FIXME: check the actual proxyRes.headers
            var chunks = [];
            proxyRes.on('data', (chunk) => {
              chunks.push(chunk);
            })
            proxyRes.on('end', function () {
              brotliDecompress(Buffer.concat(chunks), (err, outBuffer) => {
                if (err) {
                  console.log(err)
                }
                const originalResStr = outBuffer.toString()
                //res.end(originalResStr)
                const newResStr = originalResStr.replace(/l="https:\/\/"\+c/,'l="/segment/api"')
                res.end(newResStr)
              })
            })
          });
        },
      },
      '^/segment/api/.*': {
        target: 'https://api.segment.io/v1',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/segment\/api/, ''),
      }
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
    }
  },
}
