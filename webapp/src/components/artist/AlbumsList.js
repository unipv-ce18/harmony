import {Component} from "preact";
import styles from './ArtistPage.scss';

class AlbumsList extends Component {
  constructor(props) {
    super(props);
    this.state = {order: 'date'};
    this.handleChangeOrder = this.handleChangeOrder.bind(this);
  }

  handleChangeOrder(event) {
    this.setState({
      order: event.target.name
    });
  }

  render() {
    const order = this.state.order;
    let list = this.props.list;

    list.sort(function (a, b) {
      switch (order) {
        case 'date':
          return a.date < b.date;
        case 'az':
          return a.name > b.name;
        case 'za':
          return a.name < b.name;
        case 'type':
          return a.type > b.type;
      }});

    return(
      <div class={styles.albumsList}>
        <div className={styles.sort}>
          Sort by:
          <button className={order == 'az' ? "active" : ""} onClick={this.handleChangeOrder} name='az'>AZ</button>
          <button className={order == 'za' ? "active" : ""} onClick={this.handleChangeOrder} name='za'>ZA</button>
          <button className={order == 'type' ? "active" : ""} onClick={this.handleChangeOrder} name='type'>TYPE</button>
          <button className={order == 'date' ? "active" : ""} onClick={this.handleChangeOrder} name='date'>DATE</button>
        </div>
        {list.map(item => <div class = {styles.album} style={{backgroundImage : "url('" + item.cover + "')"}}>{item.name} - {item.date} - {item.type}</div> ) }
      </div>
    );
  }
}

export default AlbumsList;
