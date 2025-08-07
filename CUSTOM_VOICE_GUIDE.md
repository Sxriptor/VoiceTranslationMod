# 🎤 Custom Voice Feature Guide

## ✨ New Feature: Add Custom Voices

You can now add your own custom ElevenLabs voices to the voice dropdown! This is perfect for:
- Using voices from your personal ElevenLabs account
- Adding cloned voices you've created
- Using specific voice IDs you know about

## 🚀 How to Add a Custom Voice

### Step 1: Get Your Voice ID
1. **From ElevenLabs Dashboard:**
   - Go to https://elevenlabs.io/
   - Navigate to "Voices" section
   - Find the voice you want to use
   - Copy the Voice ID (20-character string like `pNInz6obpgDQGcFmaJgB`)

2. **From Voice URLs:**
   - Voice IDs are often in ElevenLabs URLs
   - Example: `https://elevenlabs.io/voice/pNInz6obpgDQGcFmaJgB`
   - The ID is the part after `/voice/`

### Step 2: Add Voice in the App
1. **Open the App:**
   ```bash
   npm run dev:simple
   ```

2. **Click "➕ Add Custom Voice"** button (next to the voice dropdown)

3. **Fill in the Modal:**
   - **Voice ID**: Enter the 20-character voice ID
   - **Display Name**: Give it a friendly name (optional)
   - **Test Voice**: Check this box to test before adding

4. **Test the Voice (Recommended):**
   - Click "🧪 Test Voice" to hear a sample
   - This ensures the voice ID works correctly

5. **Add the Voice:**
   - Click "➕ Add Voice" to add it to your list
   - The voice will appear in the dropdown with "(Custom)" label

## 🎯 Example Voice IDs

Here are some popular ElevenLabs voice IDs you can try:

```
pNInz6obpgDQGcFmaJgB - Adam (Male, English)
EXAVITQu4vr4xnSDxMaL - Bella (Female, English)  
IKne3meq5aSn9XLyUdCD - Charlie (Male, English)
onwK4e9ZLuTAKqWW03F9 - Daniel (Male, English)
```

## ✅ Features

- **Voice Validation**: Checks that voice IDs are properly formatted
- **Test Before Adding**: Hear the voice before adding it to your list
- **Persistent Storage**: Custom voices are saved and restored when you restart the app
- **Easy Management**: Custom voices appear in a separate section in the dropdown
- **Visual Distinction**: Custom voices are labeled with "(Custom)"

## 🔧 Voice ID Format

Valid voice IDs must be:
- Exactly 20 characters long
- Contain only letters and numbers (a-z, A-Z, 0-9)
- No spaces or special characters

Examples:
- ✅ `pNInz6obpgDQGcFmaJgB` (valid)
- ✅ `EXAVITQu4vr4xnSDxMaL` (valid)
- ❌ `invalid-voice-id` (contains hyphens)
- ❌ `short` (too short)

## 🎵 Using Custom Voices

Once added, custom voices work exactly like built-in voices:

1. **Select from Dropdown**: Choose your custom voice from the list
2. **Test Translation**: Use "🧪 Test Translation" to hear it
3. **Real-Time Translation**: Works with "▶️ Start Translation"
4. **All Features**: Compatible with all translation features

## 🗑️ Managing Custom Voices

Currently, custom voices are stored in your configuration file. To remove a custom voice:

1. **Temporary**: Just select a different voice (custom voice stays in list)
2. **Permanent**: You can manually edit the config file or we can add a remove feature later

## 💡 Pro Tips

1. **Test First**: Always test voices before adding them to ensure they work
2. **Descriptive Names**: Use clear names like "My Cloned Voice" or "British Male"
3. **Voice Quality**: Custom voices work best with high-quality ElevenLabs voices
4. **Account Access**: Make sure your ElevenLabs API key has access to the voice

## 🐛 Troubleshooting

### "Invalid voice ID format"
- Check that the ID is exactly 20 characters
- Ensure it contains only letters and numbers
- No spaces at the beginning or end

### "Voice test failed"
- Verify your ElevenLabs API key is configured
- Check that the voice ID exists in your account
- Ensure you have sufficient ElevenLabs credits

### "Voice already exists"
- The voice ID is already in your list
- Check the dropdown for existing voices

## 🎉 Ready to Use!

The custom voice feature is now fully functional! You can:

✅ Add unlimited custom voices  
✅ Test voices before adding them  
✅ Use them in real-time translation  
✅ Store them permanently in your config  

**Start adding your favorite voices today!** 🎤✨