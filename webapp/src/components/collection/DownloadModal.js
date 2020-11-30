import {Component} from 'preact';

import {session} from '../../Harmony';
import {createDownloadSocket, requestDownload} from '../../download';

import styles from '../SettingsModal.scss';

class DownloadModal extends Component {

  constructor(props) {
    super(props);

    this.state = {
      semitones: 0,
      outputFormat: 'wav',
      split: false
    };

    this.download = this.download.bind(this);
    this.handleChangeSemitones = this.handleChangeSemitones.bind(this);
    this.handleChangeFormat = this.handleChangeFormat.bind(this);
    this.handleChangeSplit = this.handleChangeSplit.bind(this);
  }

  handleChangeSemitones(e) {
    this.setState({semitones: e.target.value});
  }

  handleChangeFormat(e) {
    this.setState({outputFormat: e.target.value});
  }

  handleChangeSplit(e) {
    this.setState({split: e.target.value});
  }

  download(e) {
    e.preventDefault();

    session.getAccessToken()
      .then (token => {
        const socket = createDownloadSocket(token);

        requestDownload(socket, this.props.songId, this.state.semitones, this.state.outputFormat, this.state.split)
          .then(url => {
  					let a = document.createElement('a');
  					a.href = url;
  					a.click();
          })
      })
  }

  render() {
    const semitonesValues = Array.from(Array(25), (_, i) => i - 12);

    let semitones = semitonesValues.length > 0 && semitonesValues.map(value => {
      return (
        <option value={value}>{value} semitones</option>
      )
    }, this);

    return (
      <div>
        <div class={styles.settingsModal}>
          <div class={styles.download}>
            <h4>{this.props.songTitle}</h4>
            <form>
              <div class={styles.select}>
                <label for="semitones">Change pitch:</label>
                <select id="semitones" value={this.state.semitones} onChange={this.handleChangeSemitones}>
                  {semitones}
                </select>
              </div>
              <div class={styles.select}>
                <label for="outputFormat">Output format:</label>
                <select id="outputFormat" value={this.state.outputFormat} onChange={this.handleChangeFormat}>
                  <option value="wav">wav</option>
                  <option value="flac">flac</option>
                  <option value="mp3">mp3</option>
                  <option value="m4a">m4a</option>
                  <option value="webm">webm</option>
                </select>
              </div>
              <div class={styles.select}>
                <label for="split">Karaoke version?</label>
                <select id="split" value={this.state.split} onChange={this.handleChangeSplit}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              <div>
                <button onClick={this.props.handleDownloadModal.bind(this, false)}>Cancel</button>
                <button onClick={this.download}>Download</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default DownloadModal;
