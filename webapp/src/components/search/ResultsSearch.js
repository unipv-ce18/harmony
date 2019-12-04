import {Component} from "preact";
import SongResults from './SongResults';
import AlbumResults from "./AlbumResults";
import ArtistResults from "./ArtistResults";

//DA RIVEDERE

class ResultsSearch extends Component {
  render (props) {
    let results = this.props.results;
    let type = this.props.type;
    let albums = [];
    let songs = [];
    let artists = [];
    Object.keys(results).forEach(function(key) {
      if (results[key].hasOwnProperty('albums') && (type ==="all" || type === "albums")) {
        Object.keys(results[key].albums).forEach(function (key2) {
          albums.push(results[key].albums[key2]);
        });
      }
      if (results[key].hasOwnProperty('songs') && (type ==="all" || type === "songs")) {
        Object.keys(results[key].songs).forEach(function (key2) {
          songs.push(results[key].songs[key2]);
        });
      }
      if (results[key].hasOwnProperty('artists') && (type ==="all" || type === "artists")) {
        Object.keys(results[key].artists).forEach(function (key2) {
          artists.push(results[key].artists[key2]);
        });
      }
    });

   return (
     <div>
       {songs.length ? (<div><h1>Songs</h1> {songs.map(item => <SongResults key={item.id} values={item} />)}</div>) : null}
       {albums.length ? (<div><h1>Albums</h1> {albums.map(item => <AlbumResults key= {item.id} values = {item} />)}</div>) : null}
       {artists.length ? (<div><h1>Artists</h1> {artists.map(item => <ArtistResults key = {item.id} values = {item} />)}</div>) : null}
     </div>
   );
  }
}

export default ResultsSearch;
