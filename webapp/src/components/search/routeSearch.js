import {route} from 'preact-router';
import {toSearchQuery, isQueryEmpty} from '../../core/searchQuery';

export default function routeSearch(text, modifiers) {
  if (!isQueryEmpty({text, modifiers})) {
    route('/search/' + toSearchQuery(text, modifiers));

  } else {
    // No query, redirect back to home page
    route('/')
  }
}
