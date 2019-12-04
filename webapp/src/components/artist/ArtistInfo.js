import {Component} from "preact";
import styles from './ArtistPage.scss';
import Tags from "./Tags";
import Links from "./Links";

class ArtistInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {additional: false};
    this.handleActiveAdditional = this.handleActiveAdditional.bind(this);
    this.handleRemoveAdditional = this.handleRemoveAdditional.bind(this);
  }

  handleActiveAdditional() {
    this.setState({additional: true});
  }

  handleRemoveAdditional(){
    this.setState({additional: false});
  }

  render() {
    let info = this.props.info;
    const additional = this.state.additional;
    let additionalInfo, members, links, life_span;
    if(info.hasOwnProperty('life_span')){
      life_span = (
        <span>{info.life_span.begin} - {info.life_span.end == null ? "Still Active" : info.life_span.end}</span>
      );
    }
    if(info.hasOwnProperty('members') && info.members.length > 1) {
      members = (<ul>
        {info.members.map(item => <li className={styles.member}>{item.name} - {item.role}</li>)}
      </ul>);
    }
    if(info.hasOwnProperty('links')){
      links = (<div>
        {Object.keys(info.links).length > 0 ? <Links links = {info.links}/> : null}
        </div>
      );
    }

    if (additional) {
      additionalInfo = (
        <div id='additionalInfo'>
          {life_span}
          {members}
          {links}
          <button onClick={this.handleRemoveAdditional}>Remove</button>
        </div>);
    } else {
      additionalInfo = (<button onClick={this.handleActiveAdditional}>...</button>);
    }


    return(
      <div>
        <div class={styles.artistInfo} style = {{backgroundImage: "url('" + info.image + "')"}}>
          <h2 class={styles.name}>{info.name}</h2>
          <Tags list = {info.genres}/>
        </div>
        <div class={styles.artistBio}>
          {info.bio}
        </div>
        {additionalInfo}
      </div>
        );
  }
}

export default ArtistInfo;
