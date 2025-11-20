# Service Seeking Concierge Demo

This is a demo website that replicates the Service Seeking homepage and integrates with a Voiceflow conversational assistant.

## Files

- `index.html` - Main website file with Service Seeking design
- `style.css` - Styling with Service Seeking brand colors (blue theme)
- `voiceflow-image-upload-integration.js` - Image upload functionality for the chat widget

## Features

### Homepage
- **Service Seeking Brand Design**: Blue gradient hero section (#0066cc)
- **Job Description Input**: Instead of traditional category search, users describe their job
- **Popular Services**: Grid of service categories (Painting, Electricians, Plumbing, Building, etc.)
- **How It Works**: Step-by-step guide
- **Trust Indicators**: Star rating, business count, jobs posted

### Voiceflow Integration
- **Project ID**: `68d0f6bf57cfeddb8e97923a`
- **Embedded Modal**: Opens when user clicks "Get Quotes"
- **Job Description**: Passes user's job description to Voiceflow on launch
- **Image Upload**: Camera icon button for uploading photos during conversation

## How to Test

### Option 1: Open Directly in Browser
Simply double-click `index.html` to open in your default browser.

### Option 2: Use a Local Server (Recommended)
For better testing, use a local server:

```bash
# Using Python 3
cd /Users/tonywall/Desktop/concierge_demo
python3 -m http.server 8000

# Then open: http://localhost:8000
```

Or use any other local server tool (Live Server VS Code extension, etc.)

## Testing Flow

1. **Homepage**: Enter a job description (e.g., "I need my bathroom painted")
2. **Click "Get Quotes"**: Modal opens with Voiceflow chat
3. **Conversation**: The assistant will guide through job creation
4. **Image Upload**: Use the camera icon to upload photos of the job site
5. **Complete**: Assistant creates job in Service Seeking system

## Voiceflow Project Details

- **Project ID**: `68d0f6bf57cfeddb8e97923a`
- **MCP Server**: `ss-mcp-server` (Service Seeking job creation tools)
- **Image Analysis**: Uses painters MCP server for analyze_image tool

## MCP Tools Available

The Voiceflow agent has access to:
- `create_job` - Creates jobs in Service Seeking
- `search_categories` - Finds matching service categories
- `get_pricing_reference` - Real-world pricing examples
- `get_site_availability_reference` - Availability collection guidance

## Mobile Responsive

The demo is fully responsive:
- Desktop: 760x560 modal window
- Mobile: Full-screen chat experience
- Touch-friendly: All buttons and inputs optimized for mobile

## Brand Colors

- **Primary Blue**: #0066cc
- **Darker Blue**: #0052a3
- **Orange CTA**: #ff6b35
- **Background**: #f8f9fa

## Notes

- Image upload uses the painters MCP server for image analysis
- Job creation uses the ss-mcp-server
- Form extension included for contact details collection
- Modal closes with X button (no auto-close on submit)
