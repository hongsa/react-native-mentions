import React, { Component } from 'react';
import {
  Text,
  View,
  Animated,
  TextInput,
  FlatList,
  ViewPropTypes
} from 'react-native';
import PropTypes from 'prop-types';

export default class MentionsTextInput extends Component {
  constructor() {
    super();
    this.state = {
      textInputHeight: "",
      isTrackingStarted: false,
      suggestionRowHeight: new Animated.Value(0),

    }
    this.isTrackingStarted = false;
    this.previousChar = " ";
  }

  componentWillMount() {
    this.setState({
      textInputHeight: this.props.textInputMinHeight
    })
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.value) {
      this.resetTextbox();
    } else if (this.isTrackingStarted && !nextProps.horizontal && nextProps.suggestionsData.length !== 0) {
      const numOfRows = nextProps.MaxVisibleRowCount >= nextProps.suggestionsData.length ? nextProps.suggestionsData.length : nextProps.MaxVisibleRowCount;
      const height = numOfRows * nextProps.suggestionRowHeight;
      this.openSuggestionsPanel(height);
    }
  }

  startTracking() {
    this.isTrackingStarted = true;
    this.openSuggestionsPanel();
    this.setState({
      isTrackingStarted: true
    })
  }

  stopTracking() {
    this.isTrackingStarted = false;
    this.closeSuggestionsPanel();
    this.setState({
      isTrackingStarted: false
    })
  }

  openSuggestionsPanel(height) {
    Animated.timing(this.state.suggestionRowHeight, {
      toValue: height ? height : this.props.suggestionRowHeight,
      duration: 100,
    }).start();
  }

  closeSuggestionsPanel() {
    Animated.timing(this.state.suggestionRowHeight, {
      toValue: 0,
      duration: 100,
    }).start();
  }

  updateSuggestions(lastKeyword) {
    this.props.triggerCallback(lastKeyword);
  }

  identifyKeyword(val) {
    if (this.isTrackingStarted) {
      const boundary = this.props.triggerLocation === 'new-word-only' ? 'B' : '';
      const pattern = new RegExp(`\\${boundary}${this.props.trigger}[a-z0-9_-ㄱ-ㅎ|ㅏ-ㅣ|가-힣]+|\\${boundary}${this.props.trigger}`, `gi`);
      const keywordArray = val.match(pattern);
      if (keywordArray && !!keywordArray.length) {
        const lastKeyword = keywordArray[keywordArray.length - 1];
        this.updateSuggestions(lastKeyword);
      }
    }
  }

  onChangeText(val) {
    this.props.onChangeText(val); // pass changed text back
    const lastChar = val.substr(val.length - 1);
    const wordBoundry = (this.props.triggerLocation === 'new-word-only') ? this.previousChar.trim().length === 0 : true;
    if (lastChar === this.props.trigger && wordBoundry) {
      this.startTracking();
    } else if (lastChar === ' ' && this.state.isTrackingStarted || val === "") {
      this.stopTracking();
    }
    this.previousChar = lastChar;
    this.identifyKeyword(val);
  }

  resetTextbox() {
    this.previousChar = " ";
    this.stopTracking();
    this.setState({ textInputHeight: this.props.textInputMinHeight });
  }

  render() {
    return (
      <View>
      {this.props.renderPosition === 'up' ?
      <Animated.View style={[
        { ...this.props.suggestionsPanelStyle }, 
        {position:'absolute', bottom: 40, width: '100%', height: this.state.suggestionRowHeight }
      ]}>
      <FlatList
        keyboardShouldPersistTaps={"always"}
        horizontal={this.props.horizontal}
        enableEmptySections={true}
        data={this.props.suggestionsData}
        keyExtractor={this.props.keyExtractor}
        renderItem={(rowData) => { return this.props.renderSuggestionsRow(rowData, this.stopTracking.bind(this)) }}
      />
    </Animated.View>
  :null}
        <TextInput
          {...this.props}
          onContentSizeChange={(event) => {
            this.setState({
              textInputHeight: this.props.textInputMinHeight >= event.nativeEvent.contentSize.height ? this.props.textInputMinHeight : event.nativeEvent.contentSize.height + 10,
            });
          }}
          ref={this.props.textInputRef}
          onChangeText={this.onChangeText.bind(this)}
          multiline={true}
          value={this.props.value}
          style={[{ ...this.props.textInputStyle }, { height: Math.min(this.props.textInputMaxHeight, this.state.textInputHeight) }]}
          placeholder={this.props.placeholder ? this.props.placeholder : 'Write a comment...'}
        />
        {this.props.renderPosition === 'down' ?
      <Animated.View style={[{ ...this.props.suggestionsPanelStyle }, { height: this.state.suggestionRowHeight }]}>
      <FlatList
        keyboardShouldPersistTaps={"always"}
        horizontal={this.props.horizontal}
        enableEmptySections={true}
        data={this.props.suggestionsData}
        keyExtractor={this.props.keyExtractor}
        renderItem={(rowData) => { return this.props.renderSuggestionsRow(rowData, this.stopTracking.bind(this)) }}
      />
    </Animated.View>
  :null}
      </View>
    )
  }
}

MentionsTextInput.propTypes = {
  renderPosition: PropTypes.oneOf(['up', 'down']),
  textInputStyle: TextInput.propTypes.style,
  suggestionsPanelStyle: ViewPropTypes.style,
  loadingComponent: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.element,
  ]),
  textInputMinHeight: PropTypes.number,
  textInputMaxHeight: PropTypes.number,
  trigger: PropTypes.string.isRequired,
  triggerLocation: PropTypes.oneOf(['new-word-only', 'anywhere']).isRequired,
  value: PropTypes.string.isRequired,
  onChangeText: PropTypes.func.isRequired,
  triggerCallback: PropTypes.func.isRequired,
  renderSuggestionsRow: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.element,
  ]).isRequired,
  suggestionsData: PropTypes.array.isRequired,
  keyExtractor: PropTypes.func.isRequired,
  horizontal: PropTypes.bool,
  suggestionRowHeight: PropTypes.number.isRequired,
  MaxVisibleRowCount: function(props, propName, componentName) {
    if(!props.horizontal && !props.MaxVisibleRowCount) {
      return new Error(
        `Prop 'MaxVisibleRowCount' is required if horizontal is set to false.`
      );
    }
  }
};

MentionsTextInput.defaultProps = {
  textInputStyle: { borderColor: '#ebebeb', borderWidth: 1, fontSize: 15 },
  suggestionsPanelStyle: { backgroundColor: 'rgba(100,100,100,0.1)' },
  loadingComponent: () => <Text>Loading...</Text>,
  textInputMinHeight: 30,
  textInputMaxHeight: 80,
  horizontal: true,
  renderPosition: 'down'
}
