import {Component} from "preact";
import SongResults from './SongResults';
import ReleaseResults from "./ReleaseResults";
import ArtistResults from "./ArtistResults";
import styles from './SearchPage.scss';


//DA RIVEDERE

class ResultsSearch extends Component {
  render (props) {
    let results = this.props.results;
    let type = this.props.type;
    let release = [];
    let songs = [];
    let artists = [];
    Object.keys(results).forEach(function(key) {
      if (results[key].hasOwnProperty('releases') && (type ==="all" || type === "release")) {
        Object.keys(results[key].releases).forEach(function (key2) {
          release.push(results[key].releases[key2]);
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
       {release.length ? (<div><h1>Releases</h1> {release.map(item => <ReleaseResults key= {item.id} values = {item} />)}</div>) : null}
       {artists.length ? (<div><h1>Artists</h1> {artists.map(item => <ArtistResults key = {item.id} values = {item} />)}</div>) : null}
     </div>
   );
  }
}

export default ResultsSearch;
