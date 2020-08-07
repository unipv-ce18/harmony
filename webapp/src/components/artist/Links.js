import {Component} from "preact";
import styles from './ArtistPage.scss';
import website from '../../assets/links/website.png';
import facebook from '../../assets/links/facebook.png';
import twitter from '../../assets/links/twitter.png';
import instagram from '../../assets/links/instagram.png';

class Links extends Component{
  render({links}){
    return(
      <div className={styles.links}>
        <div>
          {links.hasOwnProperty('website') && <a href={links.website}><img src={website}>Website</img></a>}
          {links.hasOwnProperty('facebook') && <a href={links.facebook}><img src={facebook}>Facebook</img></a>}
          {links.hasOwnProperty('twitter') && <a href={links.twitter}><img src={twitter}></img></a>}
          {links.hasOwnProperty('instagram') && <a href={links.instagram}><img src={instagram}></img></a>}
        </div>
      </div>
    );
  }
}

export default Links;
