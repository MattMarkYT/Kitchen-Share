import PocketBase from 'pocketbase';

const pb = new PocketBase('http://35.197.54.255:8090/');


if (typeof window !== 'undefined') {
    pb.autoCancellation(false);
}

export default pb;
