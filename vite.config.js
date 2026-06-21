import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'
import url from 'url'
import fs from 'fs'
import path from 'path'

// Custom Vite plugin to act as local backend for TTS and File Uploads
const localBackendPlugin = () => ({
  name: 'local-backend',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const parsedUrl = url.parse(req.url, true)

      // 1. GOOGLE TTS PROXY ENDPOINT
      if (parsedUrl.pathname === '/api/tts') {
        const text = parsedUrl.query.text || ''
        const lang = parsedUrl.query.lang || 'id'
        const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`
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
      }

      // 2. LOCAL FILE UPLOAD ENDPOINT
      else if (parsedUrl.pathname === '/api/upload' && req.method === 'POST') {
        let body = []
        req.on('data', (chunk) => {
          body.push(chunk)
        })
        req.on('end', () => {
          try {
            // Buffer data biner utuh
            const buffer = Buffer.concat(body)

            // Dapatkan Content-Type untuk mendeteksi boundary multipart
            const contentType = req.headers['content-type']
            const boundaryMatch = contentType && contentType.match(/boundary=(.+)/)
            const boundary = boundaryMatch && boundaryMatch[1]

            if (!boundary) {
              res.writeHead(400)
              res.end('Boundary multipart tidak ditemukan')
              return
            }

            // Temukan batas boundary biner dalam buffer
            const boundaryBuffer = Buffer.from('--' + boundary)
            const parts = []
            let start = 0

            while (true) {
              const index = buffer.indexOf(boundaryBuffer, start)
              if (index === -1) break
              if (start > 0) {
                parts.push(buffer.subarray(start, index - 2)) // Hapus CRLF (\r\n)
              }
              start = index + boundaryBuffer.length
            }

            // Cari part yang berisi file gambar
            let fileData = null
            let filename = ''

            for (const part of parts) {
              const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'))
              if (headerEnd === -1) continue

              const headers = part.subarray(0, headerEnd).toString()
              const content = part.subarray(headerEnd + 4)

              if (headers.includes('filename=')) {
                const nameMatch = headers.match(/filename="([^"]+)"/)
                filename = nameMatch ? nameMatch[1] : 'avatar.png'
                fileData = content
                break
              }
            }

            if (!fileData) {
              res.writeHead(400)
              res.end('File tidak ditemukan dalam request')
              return
            }

            // Pastikan folder /public/avatars/ ada
            const publicDir = path.resolve(process.cwd(), 'public')
            const avatarsDir = path.resolve(publicDir, 'avatars')

            if (!fs.existsSync(avatarsDir)) {
              fs.mkdirSync(avatarsDir, { recursive: true })
            }

            // Tentukan filename unik agar cache browser ter-reset
            const ext = path.extname(filename) || '.png'
            const uniqueFilename = `avatar-${Date.now()}${ext}`
            const savePath = path.join(avatarsDir, uniqueFilename)

            // Simpan berkas secara fisik di disk lokal
            fs.writeFileSync(savePath, fileData)

            // Kirim respons balik berupa path URL statis
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            })
            res.end(JSON.stringify({
              success: true,
              url: `/avatars/${uniqueFilename}`
            }))

          } catch (error) {
            console.error('Upload Error:', error)
            res.writeHead(500)
            res.end('Upload failed')
          }
        })
      } else {
        next()
      }
    })
  }
})

export default defineConfig({
  plugins: [react(), localBackendPlugin()],
})
