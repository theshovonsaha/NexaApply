# nexaApply API Documentation

## Content Script API

### FormAnalyzer

```javascript
class FormAnalyzer {
    async detectFields()
    analyzeField(element)
    findFieldLabel(element)
    determineFieldPurpose(field)
    matchesPattern(field, patterns)
    generateSelector(element)
}
```

### DebugOverlay

```javascript
class DebugOverlay {
    show()
    hide()
    logMessage(message, type = 'info')
    showError(error)
}
```

## AI Integration API

### MistralAI

```javascript
class MistralAI {
    async analyzeForm(formData)
    async sendRequest(prompt)
    parseAIResponse(response)
}
```

## Message Types

### Background to Content Script

- ANALYSIS_COMPLETE
- ANALYSIS_ERROR

### Content Script to Background

- ANALYZE_FORM
- UPDATE_STATUS

### Popup to Content Script

- START_AUTOFILL
- TOGGLE_DEBUG
