const fs = require('fs-extra')
const path = require('path')
const ProgressBar = require('progress')
const Downloader = require('sapui5-downloader-core')

const packageJSONPath = path.resolve(`${__dirname}/../../../package.json`)
let config
try {
  const packageJSON = require(packageJSONPath)
  config = packageJSON['sapui5-runtime'] || {}
} catch (error) {
  config = {}
}

const libDir = path.resolve(`${__dirname}/../lib`)
const tmpDir = path.resolve(`${__dirname}/../tmp`)
let selectedSAPUI5Version = config.version

async function installSAPUI5(downloader) {
  let downloadProgressBar
  let extractionProgressBar
  const zipFile = await downloader.downloadSAPUI5(selectedSAPUI5Version, (total, progress) => {
    if (downloadProgressBar instanceof ProgressBar) {
      downloadProgressBar.tick(progress)
    } else {
      downloadProgressBar = new ProgressBar('Downloading: [:bar] :rate/bps :percent :etas', {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total,
      })
    }
  })

  await downloader.extractSAPUI5(zipFile, (total, progress) => {
    if (extractionProgressBar instanceof ProgressBar) {
      extractionProgressBar.tick(progress)
    } else {
      extractionProgressBar = new ProgressBar('Extracting: [:bar] :percent :etas', {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total,
      })
    }
  })
}

(async () => {
  const downloader = new Downloader('Runtime', tmpDir, libDir)

  if (!selectedSAPUI5Version) {
    try {
      selectedSAPUI5Version = await downloader.getLatestVersion()
    } catch (error) {
      console.error(error.message)
      process.exit()
    }
  }

  try {
    const sapUIVersionFile = await fs.readFile(path.resolve(`${libDir}/resources/sap-ui-version.json`))
    const installedSAPUI5Version = JSON.parse(sapUIVersionFile.toString('utf8')).version
    if (installedSAPUI5Version === selectedSAPUI5Version) {
      console.log(`SAPUI5 version ${installedSAPUI5Version} already installed.`)
    } else {
      await installSAPUI5(downloader)
    }
  } catch (readFileError) {
    if (readFileError.code === 'ENOENT') {
      await installSAPUI5(downloader)
    } else {
      throw readFileError
    }
  }
})()
