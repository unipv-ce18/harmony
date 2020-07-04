import {Component} from "preact";
import logoImage from "!file-loader!../assets/logo.svg";
import SearchInput from "../components/search/SearchInput";

class MiddleBar extends Component {
  render(props) {
    let content;
    if(this.props.page === '/'){
        content =  <img src={logoImage} alt=""/>
     } else {
       content = <SearchInput autofocus/>
     }
    return (
      <div>
        {content}
      </div>
    );

  }
}

export default MiddleBar;
