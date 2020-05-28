import {Component} from "preact";
import logoImage from "!file-loader!../assets/logo.svg";
import Search from "../components/search/Search";

class MiddleBar extends Component {
  render(props) {
    let content;
    if(this.props.page === '/'){
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
