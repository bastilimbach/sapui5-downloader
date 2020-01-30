const url = require('url')
const path = require('path')
const fs = require('fs-extra')
const rpn = require('request-promise-native')
const request = require('request')
const StreamZip = require('node-stream-zip')

/**
 * Class which is responsible for downloading and extracting SAPUI5 from
 * https://tools.hana.ondemand.com/ for local development.
 */
class Downloader {
  /**
   * Creates a new Downloader instance.
   *
   * @param {string} type The SAPUI5 type: "Runtime" or "SDK".
   * @param {string} downloadDir Directory where SAPUI5 is downloaded to.
   * @param {string} destinationDir Directory in which the files will be unpacked.
   */
  constructor(type, downloadDir, destinationDir) {
    const sapui5Types = {
      Runtime: 'rt',
      SDK: 'sdk',
    }

    if (!sapui5Types[type]) {
      throw new Error('Unsupported SAPUI5 type. Either choose "Runtime" or "SDK".')
    }

    if (!downloadDir) {
      throw new Error('You need to specify a download directory.')
    }

    if (!destinationDir) {
      throw new Error('You need to specify the destination directory to which SAPUI5 will be installed.')
    }

    this.type = sapui5Types[type]
    this.directories = {
      download: downloadDir,
      extract: destinationDir,
    }
    this.downloadEndpoint = url.parse('https://tools.hana.ondemand.com/additional/')
  }

  /**
   * Determines the latest SAPUI5 version by parsing the sap-ui-version.json file
   * on https://sapui5.hana.ondemand.com/.
   *
   * @returns {Promise<string>} The latest SAPUI5 version.
   */
  async getLatestVersion() {
    console.log('Searching for latest SAPUI5 version...')

    const versionEndpoint = url.parse('https://sapui5.hana.ondemand.com/resources/sap-ui-version.json')
    const versionData = await rpn({ url: versionEndpoint.href, json: true })
    const patchHistory = [
      ...new Set([...versionData.libraries[0].patchHistory, versionData.version].reverse()),
    ]
    const testedVersions = []
    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < patchHistory.length; i += 1) {
      try {
        const downloadURL = url.resolve(this.downloadEndpoint.href, `sapui5-${this.type}-${patchHistory[i]}.zip`)
        await rpn({ url: downloadURL, json: true })
        console.log(`SAPUI5 version ${patchHistory[i]} found.`)
        return patchHistory[i]
      } catch (versionError) {
        testedVersions.push({
          version: patchHistory[i],
          url: url.resolve(this.downloadEndpoint.href, `sapui5-${this.type}-${patchHistory[i]}.zip`),
        })
      }
    }
    throw new Error(`Could not determine the available SAPUI5 version. I tried the following versions: ${JSON.stringify(testedVersions, null, 2)}`)
  }

  /**
  * Function which will be called upon each progress tick.
  *
  * @callback updateProgressCallback
  * @param {number} totalContentLength The total amount of data.
  * @param {number} retrievedContentLength The amount of data which was already processed.
  */

  /**
   * Downloads a specific SAPUI5 version to the download directory.
   *
   * @param {string} sapui5Version The SAPUI5 version which should be downloaded.
   * @param {updateProgressCallback} updateProgress
   *  Function which is called upon data retrieval. Can be used to display the remaining amount of
   *  data which is still needed to be download.
   *
   * @returns {string} The directory path to which SAPUI5 was downloaded to.
   */
  async downloadSAPUI5(sapui5Version, updateProgress) {
    if (!sapui5Version) {
      throw new Error('You need to provide the SAPUI5 version.')
    }

    const sapui5DownloadURL = url.resolve(this.downloadEndpoint.href, `sapui5-${this.type}-${sapui5Version}.zip`)

    console.log(`SAPUI5 download URL: ${sapui5DownloadURL}`)

    await fs.remove(this.directories.download)
    await fs.mkdirp(this.directories.download)

    console.warn('By using this npm package you agree to the EULA from SAP: https://tools.hana.ondemand.com/developer-license-3_1.txt/')
    console.log('Downloading SAPUI5...')

    const zipFile = path.join(this.directories.download, 'sapui5.zip')

    return new Promise((resolve, reject) => {
      const req = request({
        url: sapui5DownloadURL,
        headers: {
          Cookie: 'eula_3_1_agreed=tools.hana.ondemand.com/developer-license-3_1.txt',
        },
      })

      let contentLength
      req
        .on('response', (response) => {
          contentLength = parseInt(response.headers['content-length'], 10)
        })
        .on('data', (data) => {
          if (updateProgress) {
            updateProgress(contentLength, data.length)
          }
        })
        .on('end', () => {
          console.log('SAPUI5 downloaded')
          resolve(zipFile)
        })
        .on('error', reject)
        .pipe(fs.createWriteStream(zipFile))
    })
  }

  /**
   * Extracts a specified SAPUI5 zip archive to the destination directory.
   *
   * @param {string} zipFile The SAPUI5 zip archive file path.
   * @param {updateProgressCallback} updateProgress
   *  Function which is called upon data retrieval. Can be used to display the remaining amount of
   *  data which is still needed to be extracted.
   */
  async extractSAPUI5(zipFile, updateProgress) {
    console.log(`Extracting SAPUI5 to ${this.directories.extract}`)

    await fs.remove(this.directories.extract)
    await fs.mkdirp(this.directories.extract)

    const zip = new StreamZip({
      file: zipFile,
      storeEntries: true,
    })

    zip.on('ready', () => {
      zip
        .on('extract', () => {
          if (updateProgress) {
            updateProgress(zip.entriesCount)
          }
        })
        .extract(null, this.directories.extract, () => {
          zip.close(() => {
            console.log('SAPUI5 extracted')
          })
        })
    })
  }
}

module.exports = Downloader
