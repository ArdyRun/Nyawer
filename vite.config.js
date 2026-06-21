import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'
import url from 'url'

// Custom Vite plugin to act as a local backend proxy for Google TTS
const ttsProxyPlugin = () => ({
  name: 'tts-proxy',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const parsedUrl = url.parse(req.url, true)
      if (parsedUrl.pathname === '/api/tts') {
        const text = parsedUrl.query.text || ''
        const lang = parsedUrl.query.lang || 'id'

        // Google Translate TTS endpoint
        const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`

        // Headers to pretend to be a standard browser request and avoid 403 blocks
        const options = {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://translate.google.com/'
          }
        }

        https.get(googleUrl, options, (googleRes) => {
          res.writeHead(googleRes.statusCode, {
            'Content-Type': 'audio/mpeg',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache'
          })
          googleRes.pipe(res)
        }).on('error', (err) => {
          console.error('Vite TTS Proxy Error:', err)
          res.writeHead(500)
          res.end('Error fetching TTS')
        })
      } else {
        next()
      }
    })
  }
})

export default defineConfig({
  plugins: [react(), ttsProxyPlugin()],
})
