import {Component} from "preact";
import styles from './ArtistPage.scss';

class Links extends Component{
  render({links}){
    return(
      <div className={styles.links}>
        <ul>
          {links.hasOwnProperty('website') && <li><a href={links.website}>Website</a></li>}
          {links.hasOwnProperty('facebook') && <li><a href={links.facebook}>Facebook</a></li>}
          {links.hasOwnProperty('twitter') && <li><a href={links.twitter}>Twitter</a></li>}
          {links.hasOwnProperty('instagram') && <li><a href={links.instagram}>Instagram</a></li>}
        </ul>
      </div>
    );
  }
}

export default Links;
