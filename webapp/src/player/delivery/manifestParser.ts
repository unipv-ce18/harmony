import {MediaResource, MediaResourceStream, MediaResourceVariant, MediaResourceSegment} from './MediaResource';

function getChildElements(parent: Element, nodeName: string): Element[] {
    return Array.from(parent.childNodes).filter(node => node.nodeName === nodeName) as Element[];
}

function parseVariant(reprNode: Element, baseUrl: string): MediaResourceVariant {
    const msv = new MediaResourceVariant(
        parseInt(reprNode.getAttribute('bandwidth')!),
        parseInt(reprNode.getAttribute('audioSamplingRate')!));

    const segTplNode = getChildElements(reprNode, 'SegmentTemplate')[0];

    const initUri = baseUrl + segTplNode.getAttribute('initialization')!;
    const mediaTemplate = segTplNode.getAttribute('media')!;
    const timescale = parseInt(segTplNode.getAttribute('timescale')!)

    const segNodes = getChildElements(getChildElements(segTplNode, 'SegmentTimeline')[0], 'S');
    const segments: MediaResourceSegment[] = segNodes.flatMap(s => {
        const count = parseInt(s.getAttribute('r') || '0') + 1;
        const baseTime = parseInt(s.getAttribute('t')!);
        const duration = parseInt(s.getAttribute('d')!);

        return [...Array(count).keys()]
            .map(i => baseTime + i * duration)
            .map(time => ({
                t: time / timescale,
                d: duration / timescale,
                u: baseUrl + mediaTemplate.replace(/\$Time\$/, time.toString())
            }))
    })

    return msv.complete(initUri, segments);
}

function calcDuration(variants: MediaResourceVariant[]): number {
    return Math.min(...variants.map(v => v.getTimeLength()!))
}

/**
 * Parses an XML MPD Manifest into a player {@link MediaResource}
 *
 * @param manifest - The manifest XML document to parse
 * @param mediaId - The media ID to put in the output player resource
 * @param baseUrl - The URL to prepend to segment file names extracted from the manifest
 *
 * @returns A media resource for use by the player
 * @throws Error - if a parsing error occurs
 */
export function parseMediaManifest(manifest: Document, mediaId: string, baseUrl: string): MediaResource {
    const mpdNode = manifest.documentElement;

    const periodNode = getChildElements(mpdNode, 'Period')[0];
    const mediaSetNode = getChildElements(periodNode, 'AdaptationSet')[0];

    if (mediaSetNode.getAttribute('contentType') !== 'audio')
        throw Error('Expected audio content type')

    const keyId = getChildElements(mediaSetNode, 'ContentProtection')[0]
        .getAttribute('cenc:default_KID')!.replace(/-/g, '');

    const reprNodes = getChildElements(mediaSetNode, 'Representation');
    const codec = reprNodes[0].getAttribute('codecs')!;
    const mimeType = reprNodes[0].getAttribute('mimeType')!;

    const variants = reprNodes.map(rn => parseVariant(rn, baseUrl));

    return new MediaResource(mediaId, calcDuration(variants), keyId, [
        new MediaResourceStream(0, mimeType, codec, variants)
    ])
}
