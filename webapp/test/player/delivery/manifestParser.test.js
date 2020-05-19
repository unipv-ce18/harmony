import fs from 'fs';
import path from 'path';
import {DOMParser} from 'xmldom';

import {parseMediaManifest} from '../../../src/player/delivery/manifestParser'

function loadXml(filePath) {
  const xmlText = fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
  return new DOMParser().parseFromString(xmlText, 'text/xml')
}

import manifestExpected from './res/expected-manifest'
const manifestSource = loadXml('./res/source-manifest.mpd');

describe('manifestParser', () => {
  it('should parse the sample manifest correctly', () => {
    const manifestParsed = parseMediaManifest(manifestSource, 'TEST_MEDIA_ID', 'https://media.hy.net/test/')
    expect(manifestParsed).toStrictEqual(manifestExpected)
  })
})
