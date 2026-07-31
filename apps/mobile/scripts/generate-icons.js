const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const ASSETS_DIR = path.join(__dirname, '../assets')
const WEB_PUBLIC_DIR = path.join(__dirname, '../../../apps/web/public')

// --- Source logo from web app ---
const logoPath = path.join(WEB_PUBLIC_DIR, 'afriglobal_logo.png')

async function generateIcon(size, outputPath, padding = 0.2) {
  const paddingPx = Math.floor(size * padding)
  const logoSize = size - paddingPx * 2

  // --- White square background ---
  const background = {
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  }

  // --- Resize logo to fit with padding ---
  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .toBuffer()

  // --- Composite logo on white background ---
  await sharp(background)
    .composite([
      {
        input: logo,
        top: paddingPx,
        left: paddingPx,
      },
    ])
    .png()
    .toFile(outputPath)

  console.log(`✓ Generated ${path.basename(outputPath)} (${size}x${size})`)
}

async function generateCircleIcon(size, outputPath, padding = 0.2) {
  const paddingPx = Math.floor(size * padding)
  const logoSize = size - paddingPx * 2

  // --- Create circular mask ---
  const circle = Buffer.from(
    `<svg width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
    </svg>`
  )

  // --- Resize logo ---
  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .toBuffer()

  // --- Blue background circle ---
  const blueCircle = Buffer.from(
    `<svg width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#15679b"/>
    </svg>`
  )

  // --- White inner circle ---
  const innerRadius = Math.floor(size * 0.42)
  const whiteCircle = Buffer.from(
    `<svg width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${innerRadius}" fill="white"/>
    </svg>`
  )

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 21, g: 103, b: 155, alpha: 1 },
    },
  })
    .composite([
      { input: whiteCircle, top: 0, left: 0 },
      { input: logo, top: paddingPx, left: paddingPx },
    ])
    .png()
    .toFile(outputPath)

  console.log(`✓ Generated ${path.basename(outputPath)} (${size}x${size})`)
}

async function main() {
  // --- Ensure scripts dir exists ---
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true })
  }

  // --- Check source logo exists ---
  if (!fs.existsSync(logoPath)) {
    console.error(`✗ Logo not found at: ${logoPath}`)
    console.error('  Trying fallback path...')
    const fallback = path.join(__dirname, '../../../apps/web/public/afriglobal_logo.png')
    if (!fs.existsSync(fallback)) {
      console.error('  Fallback not found either. Place afriglobal_logo.png in apps/web/public/')
      process.exit(1)
    }
  }

  console.log('Generating AfriCover247 app icons...\n')

  // --- App icon (white bg, logo centered) ---
  await generateIcon(
    1024,
    path.join(ASSETS_DIR, 'icon.png'),
    0.18
  )

  // --- Android adaptive icon foreground (logo on transparent) ---
  await sharp(logoPath)
    .resize(768, 768, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .extend({
      top: 128,
      bottom: 128,
      left: 128,
      right: 128,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toFile(path.join(ASSETS_DIR, 'android-icon-foreground.png'))
  console.log('✓ Generated android-icon-foreground.png (1024x1024)')

  // --- Android adaptive icon background (blue) ---
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 21, g: 103, b: 155, alpha: 1 },
    },
  })
    .png()
    .toFile(path.join(ASSETS_DIR, 'android-icon-background.png'))
  console.log('✓ Generated android-icon-background.png (1024x1024)')

  // --- Favicon (48x48) ---
  await generateIcon(
    48,
    path.join(ASSETS_DIR, 'favicon.png'),
    0.1
  )

  // --- Splash icon (1284x2778 — iPhone 14 Pro Max) ---
  await sharp({
    create: {
      width: 1284,
      height: 2778,
      channels: 4,
      background: { r: 21, g: 103, b: 155, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(logoPath)
          .resize(600, 200, {
            fit: 'contain',
            background: { r: 21, g: 103, b: 155, alpha: 0 },
          })
          .toBuffer(),
        top: Math.floor((2778 - 200) / 2) - 100,
        left: Math.floor((1284 - 600) / 2),
      },
    ])
    .png()
    .toFile(path.join(ASSETS_DIR, 'splash-icon.png'))
  console.log('✓ Generated splash-icon.png (1284x2778)')

  console.log('\n✅ All icons generated successfully!')
  console.log(`   Output: ${ASSETS_DIR}`)
}

main().catch((err) => {
  console.error('Error generating icons:', err)
  process.exit(1)
})
