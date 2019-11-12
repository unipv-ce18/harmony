import {Component} from "preact";

class AlbumResults extends Component {
  render(props, state, context) {
    return(
      <div>
        <p>Album name: {props.values.name}</p>
        <p>Artist: {props.values.artist}</p>
      </div>
    );
  }
}

export default AlbumResults;
