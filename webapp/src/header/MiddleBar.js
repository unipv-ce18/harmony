import {h, Component} from "preact";
import logoImage from "../logo.svg";
import Search from "../search/Search";

class MiddleBar extends Component {
  render(props) {
    let content;
    if(this.props.page === 'homepage'){
        content =  <img src={logoImage} alt=""/>
     } else {
       content = <Search />
     }
    return (
      <div>
        {content}
      </div>
    );

  }
}

export default MiddleBar;
