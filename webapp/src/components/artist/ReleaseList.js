import {Component} from "preact";
import styles from './ArtistPage.scss';
import {route} from "preact-router";

class ReleaseList extends Component {
  constructor(props) {
    super(props);
    this.state = {order: 'date'};
    this.handleChangeOrder = this.handleChangeOrder.bind(this);
    this.handleClickRelease = this.handleClickRelease.bind(this);
  }

  handleClickRelease(event) {
    route('/release/' + event.target.getAttribute('href'));
    event.preventDefault();
  }


  handleChangeOrder(event) {
    this.setState({
      order: event.target.value
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
      <div class={styles.releaseList}>
        <div className={styles.sort}>
          Sort by:
          <select value={this.state.order} onChange={this.handleChangeOrder} class={styles.sortSelect}>
            <option value='az'>AZ</option>
            <option value='za'>ZA</option>
            <option value='type'>TYPE</option>
            <option value='date' selected>DATE</option>
          </select>
        </div>
        {list.map(item => <div class = {styles.release}><a href='1' onClick={this.handleClickRelease}><img src={item.cover} alt={item.name}/></a></div> ) }
      </div>
    );
  }
}

export default ReleaseList;
