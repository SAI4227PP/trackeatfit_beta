import React, { Component } from 'react';
import { View, Text, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error, info) {
    // Log error to an error reporting service
    console.error("Error occurred:", error);
    console.error("Error info:", info);

    // Check if the error is related to the 'uri' property
    if (error instanceof TypeError && error.message.includes("Cannot read property 'uri'")) {
      console.error("Caught TypeError: Cannot read property 'uri' of undefined");
      // Handle the error here (e.g., set a default value, show a fallback UI, etc.)
    }
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI when an error occurs
      return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ marginBottom: 20 }}>Error occurred: {this.state.error}</Text>
          <Button title="Try again" onPress={() => this.setState({ hasError: false })} />
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
