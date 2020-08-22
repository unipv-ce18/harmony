import {Component} from 'preact';

import {mediaPlayer, catalog, session} from '../../Harmony';
import {MediaItemInfo, PlayStartModes} from '../../player/MediaPlayer';
import styles from './CollectionSongsTable.scss';
import {getUserPlaylists} from '../../core/apiCalls';
import {createMediaItemInfo} from '../../core/links';
import {IconMore, IconStarFull, IconStarEmpty, IconPlay, IconPause} from '../../assets/icons/icons';
import IconButton from '../IconButton';
import {route} from 'preact-router';
import PlayerEvents from '../../player/PlayerEvents';
import PlayStates from '../../player/PlayStates';
import Menu from './Menu';

const SONGS_TYPE = 'songs';

class CollectionSongsTable extends Component {

  constructor(props) {
    super(props);

    this.state = {
      modalBox: {type:'', message:''},
      menu: false,
      updated: true,
      actualOrder: 'date'
    }

    this.handleCloseMenu = this.handleCloseMenu.bind(this);
    this.onPlayerAvailable = this.onPlayerAvailable.bind(this);
    this.onPlayerChangeSong = this.onPlayerChangeSong.bind(this);
    this.onPlayerChangeState = this.onPlayerChangeState.bind(this);
  }

  componentDidMount() {
    this.setState({songs: [...this.props.collection.songs]});
    session.getAccessToken()
      .then (token => {
        getUserPlaylists(token)
          .then(result => this.setState({userPlaylists: result}))
          .catch( () => session.error = true);
      })
    mediaPlayer.addInstanceLoadObserver(this.onPlayerAvailable);
  }

  componentDidUpdate(prevProps) {
    if (this.props.collection.songs !== prevProps.collection.songs)
      this.setState({songs: [...this.props.collection.songs]});
  }

  componentWillUnmount() {
    mediaPlayer.removeInstanceLoadObserver(this.onPlayerAvailable);
    if (mediaPlayer.instance) {
      mediaPlayer.instance.removeEventListener(PlayerEvents.NEW_MEDIA, this.onPlayerChangeSong);
      mediaPlayer.instance.removeEventListener(PlayerEvents.STATE_CHANGE, this.onPlayerChangeState);
    }
  }

  initialSongLikeState (element_id) {
    return catalog.inLibrary(SONGS_TYPE, element_id);
  };

  likeSong(function_type, element_id) {
    catalog.favorite(function_type, SONGS_TYPE, element_id);
    this.setState({updated : true})
  }

  composeTime(time) {
    let date = new Date(time);
    let seconds = ('0' + date.getUTCSeconds()).slice(-2);
    let minutes = date.getUTCMinutes();
    let hours = date.getUTCHours();
    if (hours > 0)
      return hours + ":" + minutes + ":" + seconds;
    return minutes + ":" + seconds;
  }

  compare(a, b) {
      if (a < b) return -1;
      else if (a > b) return 1;
      else return 0;
    }

  reorderList(type) {
    let orderedList = [...this.state.songs];
    if(type === this.state.actualOrder) orderedList.reverse();
    else orderedList.sort((a, b) => {
      if(type === 'title') return this.compare(a.title, b.title);
      if(type === 'artist') return this.compare(a.artist.name, b.artist.name);
      if(type === 'release') return this.compare(a.release.name, b.release.name);
      if(type === 'length') return this.compare(a.length, b.length);
    })
    this.setState({songs : orderedList});
    this.setState({actualOrder : type});
  }

  handleMenuAndElement(element) {
    this.setState({menu: true});
    this.setState({song: element});
  }

  handleCloseMenu() {
    this.setState({menu: false});
    this.setState({song: ''});
  }

  clickArtist(artist_id, e) {
     e.preventDefault();
     route('/artist/' + artist_id);
  }

  clickRelease(release_id, e) {
     e.preventDefault();
     route('/release/' + release_id);
  }

  createMediaInfo(song) {
    return createMediaItemInfo(song, this.props.isRelease ? this.props.collection : null);
  }

  playSong(song) {
    let songs = this.state.songs;
    let arrayMediaInfo = this.state.songs
      .slice(songs.indexOf(song), songs.length)
      .map(song => this.createMediaInfo(song));
      mediaPlayer.play(arrayMediaInfo, PlayStartModes.TRUNCATE_QUEUE_AND_PLAY);
  }

  onPlayerAvailable(playerInstance) {
    playerInstance.addEventListener(PlayerEvents.NEW_MEDIA, this.onPlayerChangeSong);
    playerInstance.addEventListener(PlayerEvents.STATE_CHANGE, this.onPlayerChangeState);
    if(player.instance.currentMediaInfo) {
      this.setState({songPlayed: player.instance.currentMediaInfo.id});
      this.setState({playerState: player.instance.playbackState});
    }
  }

  onPlayerChangeSong(e) {
    this.setState({songPlayed: e.detail.id});
  }

  onPlayerChangeState(e) {
    this.setState({playerState: e.detail.newState});
  }

  updateParentState(state) {
    this.setState(state);
  }

  render() {
    return (
      <div>
        {this.state.songs && this.state.songs.length > 0 &&
        <div className={styles.songsInfo}>
          <table>
            <tr>
              <th/>
              <th/>
              <th><button onClick={this.reorderList.bind(this, 'title')}>Title</button></th>
              <th>
                {!this.props.isRelease &&
                <button onClick={this.reorderList.bind(this, 'artist')}>Artist</button>}
              </th>
              <th>
                {!this.props.isRelease &&
                <button onClick={this.reorderList.bind(this, 'release')}>Release</button>}
              </th>
              <th><button onClick={this.reorderList.bind(this, 'length')}>Time</button></th>
              <th/>
            </tr>
            {this.state.songs.map(element =>
              <tr onMouseLeave={this.handleCloseMenu}>
                <td className={this.state.songPlayed === element.id ? styles.visibleButtons : styles.hidenButtons}>
                  {this.state.songPlayed === element.id && this.state.playerState === PlayStates.PLAYING ?
                  <IconButton
                    size={22}
                    name={"Pause"}
                    icon={IconPause}
                    onClick={() => mediaPlayer.pause()}/>
                      :
                  <IconButton
                    size={22}
                    name={"Play"}
                    icon={IconPlay}
                    onClick={this.state.songPlayed === element.id && this.state.playerState === PlayStates.PAUSED
                      ? () => mediaPlayer.play()
                      : this.playSong.bind(this, element)}/>}
                </td>
                <td>
                  {this.state.updated && this.initialSongLikeState(element.id)
                    ? <IconButton size={24} name="Dislike" icon={IconStarFull}
                                  onClick={this.likeSong.bind(this, 'DELETE', element.id)}/>
                    : <IconButton size={24} name="Like" icon={IconStarEmpty}
                                  onClick={this.likeSong.bind(this, 'PUT', element.id)}/>
                  }
                </td>
                <td><p>{element.title }</p></td>
                {!this.props.isRelease ?
                  [<td>
                    <a href='#' onClick={this.clickArtist.bind(this, element.artist.id)}>{element.artist.name}</a>
                  </td>,
                  <td>
                    <a href='#' onClick={this.clickRelease.bind(this, element.release.id)}>{element.release.name}</a>
                  </td>]
                  : [<td/>,<td/>]}
                <td>{this.composeTime(element.length)}</td>
                <td className={styles.hidenButtons}>
                  <IconButton size={24} name="Menu" icon={IconMore}
                        onClick={this.handleMenuAndElement.bind(this, element)}/>
                  {this.state.menu && this.state.song.id === element.id &&
                    <Menu
                      song={this.state.song}
                      userPlaylists={this.state.userPlaylists}
                      collection={this.props.collection}
                      isRelease={this.props.isRelease}
                      updateParentState={this.updateParentState.bind(this)}
                      handleCloseMenu={this.handleCloseMenu}/>}
                </td>
              </tr>
            )}
          </table>
        </div>}
      </div>
      );
  }
}

export default CollectionSongsTable;
