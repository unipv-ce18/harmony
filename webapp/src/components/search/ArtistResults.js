import {Component} from "preact";
import {route} from "preact-router";

class ArtistResults extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event) {
    route('/artist/' + this.props.values.id );
    event.preventDefault();
  }


  render(props) {
    return(
      <div>
        <p>Artist name: <a href='#' onClick={this.handleClick}>{props.values.name}</a></p>
        <p>Genre: {props.values.genres}</p>
      </div>
    );
  }
}

export default ArtistResults;
