import N3, {Store, DataFactory} from 'n3';
import type { DatasetCore, Quad, Quad_Object, Quad_Subject } from '@rdfjs/types';
import {ApplicationProfile} from "../sai-api";

const { quad, namedNode } = DataFactory;
/**
 * Wrapper around N3.Parser.parse to convert from callback style to Promise.
 * @param text Text to parse. Either Turtle, N-Triples or N-Quads.
 * @param source
 */

export const parseRdf = async (text: string, source = ''): Promise<DatasetCore> => {
    const store = new Store();
    return new Promise((resolve, reject) => {
        const parserOptions: { baseIRI?: string } = {};
        if (source) {
            parserOptions.baseIRI = source;
        }
        const parser = new N3.Parser(parserOptions);
        parser.parse(text, (error: Error, quad: Quad) => {
            if (error) {
                reject(error);
            }
            if (quad) {
                store.add(DataFactory.quad(quad.subject, quad.predicate, quad.object, DataFactory.namedNode(source)));
            } else {
                resolve(store);
            }
        });
    });
};

export const getOneObject = (set: DatasetCore): Quad_Object | undefined => [...set].shift()?.object;
export const getOneSubject = (set: DatasetCore): Quad_Subject | undefined => [...set].shift()?.subject;


export const getApplicationProfile = (set: DatasetCore): ApplicationProfile => {
    // TODO (angel) get iris using something like inrupt's prefix generator or a proxy like on sai-js
    // TODO (angel) data validation and how to handle when the applications profile is missing some components?
    const id = getOneSubject(set.match(null, namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), namedNode('http://www.w3.org/ns/solid/interop#Application')))!.value;
    const name = getOneObject(set.match(null, namedNode('http://www.w3.org/ns/solid/interop#applicationName')))!.value;
    const description = getOneObject(set.match(null, namedNode('http://www.w3.org/ns/solid/interop#applicationDescription')))!.value;
    const author = getOneObject(set.match(null, namedNode('http://www.w3.org/ns/solid/interop#applicationAuthor')))!.value;
    const thumbnail = getOneObject(set.match(null, namedNode('http://www.w3.org/ns/solid/interop#applicationThumbnail')))!.value;

    return { id, name, description, author, thumbnail };
};