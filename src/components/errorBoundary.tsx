// src/components/ErrorBoundary.jsx
import React from 'react';

class ChunkErrorBoundary extends React.Component<React.PropsWithChildren<{}>> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: { message: string | string[]; }) {
    const isChunkError = 
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.message.includes("Importing a module script failed");

    if (isChunkError) {
      // Force a hard reload from the server to grab the new deployment files
      window.location.reload();
    }
  }

  render() {
    return this.props.children; 
  }
}

export default ChunkErrorBoundary;
