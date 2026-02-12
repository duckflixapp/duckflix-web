import { Buffer } from 'buffer';
import bencode from 'bencode';
import { sha1 } from 'js-sha1';

if (typeof window !== 'undefined') {
    window.Buffer = window.Buffer || Buffer;
}

export const getMagnetFromTorrentFile = async (file: File): Promise<string | null> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const torrent = bencode.decode(buffer);

        if (!torrent.info) throw new Error('Invalid torrent file: missing info dictionary');

        const infoEncoded = bencode.encode(torrent.info);
        const infoHash = sha1(infoEncoded);

        const name = torrent.info.name ? torrent.info.name.toString() : 'torrent';

        return `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(name)}`;
    } catch (err) {
        console.error('Error while parsing .torrent:', err);
        return null;
    }
};
