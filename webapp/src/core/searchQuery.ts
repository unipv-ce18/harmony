export type SearchQuery = string;
type SearchModifier = {key: string, value?: string};
type QueryParams = {text: string, modifiers: SearchModifier[]};

const inputToUrl = (text: string) => text.replace(/[^a-z0-9]/gi, ' ').replace(/ /g, '+');
const inputFromUrl = (text: string) => text.replace(/\+/g, ' ');

export const isQueryEmpty = ({text, modifiers}: QueryParams) =>
  text === '' && modifiers.length === 0;

export function toSearchQuery(text: string, modifiers: SearchModifier[]): SearchQuery {
  const modStrings = modifiers.map(m => m.key + (m.value != null ? `=${inputToUrl(m.value)}` : ''));
  return inputToUrl(text) + (modStrings.length > 0 ? `:${modStrings.join(',')}` : '');
}

export function fromSearchQuery(data: SearchQuery): QueryParams {
  const [text, modStr] = data.split(':');

  const modifiers = modStr != null ? modStr.split(',').map(s => {
    const [key, value] = s.split('=');
    return {key, ...(value && {value: inputFromUrl(value)})};
  }) : []

  return {text: inputFromUrl(text), modifiers};
}
