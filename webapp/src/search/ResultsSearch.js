import {h, Component} from "preact";
import SongResults from './SongResults';
import AlbumResults from "./AlbumResults";

class ResultsSearch extends Component {
  render (props) {
    let results = this.props.results;
    let albums = [];
    let songs = [];
    Object.keys(results).forEach(function(key) {
      if(results[key].type == 'albums') {
        Object.keys(results[key].values).forEach(function(key2){
          albums.push(results[key].values[key2]);
        });
      }
      if(results[key].type == 'songs')
        Object.keys(results[key].values).forEach(function(key2){
          songs.push(results[key].values[key2]);
        });
      });

   return (
     <div>
       {songs.length && (<div><h1>Songs</h1> {songs.map(item => <SongResults key={item.id} values={item} />)}</div>)}
       {albums.length && (<div><h1>Albums</h1> {albums.map(item => <AlbumResults key= {item.id} values = {item} />)}</div>)}
     </div>
   );
  }
}

export default ResultsSearch;
