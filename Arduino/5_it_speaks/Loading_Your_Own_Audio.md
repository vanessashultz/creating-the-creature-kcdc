# Loading Your Own Audio

The microSD card in your workshop kit came ready to go. This guide is for afterward, when you want your creature to say something of your own.

Most of this is straightforward. There are three specific things that will waste your afternoon if nobody warns you about them, so they're called out as you go.

## What the card needs

The DFPlayer is a simple little chip and it is picky in ways a computer isn't.

| Requirement | Why |
|---|---|
| **32 GB or smaller** | Larger cards won't be recognized |
| **Formatted FAT16 or FAT32** | It cannot read exFAT or APFS at all |
| **A folder named `mp3`** | Lowercase, exactly that |
| **Files named `0001.mp3`, `0002.mp3`** | Four digits, in order |

A small card is genuinely better here. A 2 GB card formatted FAT16 is more reliable with these modules than a 64 GB card, and it costs less.

## Step 1: Format the card

Formatting means erasing the card and choosing how files get organized on it. Your computer defaults to a modern format the DFPlayer can't read, so this step isn't optional.

**This erases everything on the card.** Copy anything you want to keep first.

### macOS

1. Open **Disk Utility**
2. Go to **View > Show All Devices**. This matters, because you want the physical card, not the volume indented underneath it
3. Select the card's top-level entry and click **Erase**
4. Format: **MS-DOS (FAT)**
5. Scheme: **Master Boot Record**
6. Give it a short name in capitals, like `TRACKS`
7. Click **Erase**

### Windows

1. Open **File Explorer** and find the card under This PC
2. Right-click it and choose **Format**
3. File system: **FAT32**. If the card is large enough that Windows only offers exFAT or NTFS, the card is too big. Use a smaller one
4. Leave allocation unit size on default
5. Click **Start**

### Linux

Use GNOME Disks or `mkfs.vfat`. You want a FAT32 filesystem with an MBR partition table.

## Step 2: Convert your audio

**Renaming a file to `.mp3` does not convert it.** This is the first thing that gets people. A `.m4a` or `.mov` with the extension changed is still the same file inside, and the DFPlayer will refuse it or play noise.

Voice memos, QuickTime recordings, and phone videos are all in formats that need real conversion.

### The requirements

| Setting | Value |
|---|---|
| Format | MP3 |
| Channels | **Stereo** |
| Sample rate | 44.1 kHz |
| Bitrate | 128 kbps is plenty |

**Stereo is the one that matters.** Many DFPlayer modules sold today are clones with different decoder chips, and a good number of those play a **mono** MP3 back at roughly double speed. Your recording comes out sounding like a chipmunk, or a dolphin, and no amount of rewiring will fix it. Export stereo even if your source is a mono voice recording.

### Using VLC (Mac, Windows, or Linux)

VLC is free and works the same everywhere, so this is the option to reach for if you don't already have something.

1. **Windows:** Media > Convert/Save. **Mac:** File > Convert/Stream
2. Add or drag in your file
3. Choose the **Audio - MP3** profile
4. Click the settings or wrench icon next to the profile and confirm **Channels: 2** and **Sample Rate: 44100**
5. Pick where to save it, name it `0001.mp3`, and start

### Using the Music app (Mac only, nothing to install)

1. Music > Settings > Files > **Import Settings**
2. Import Using: **MP3 Encoder**, Setting: **Good Quality (128 kbps)**
3. Drag your file into your Music library
4. Select it, then **File > Convert > Create MP3 Version**
5. Right-click the new version and choose **Show in Finder**

### Using ffmpeg (any platform, command line)

```bash
ffmpeg -i myclip.mov -vn -codec:a libmp3lame -b:a 128k -ar 44100 -ac 2 0001.mp3
```

If your clip is quiet, this version compresses and lifts it so it carries better out of a small speaker:

```bash
ffmpeg -i myclip.mov -vn \
  -af "highpass=f=200,acompressor=threshold=-22dB:ratio=4:attack=8:release=120,volume=10dB,alimiter=limit=0.80" \
  -codec:a libmp3lame -b:a 128k -ar 44100 -ac 2 0001.mp3
```

The high-pass filter throws away deep bass that a speaker this size cannot reproduce anyway. The amplifier stops wasting power on frequencies you'd never hear, which makes the rest louder.

> Keep clips short. A couple of seconds is usually right for a creature that greets people.

## Step 3: Copy the files onto the card

Make a folder on the card named exactly `mp3`, lowercase, and put your numbered files inside it.

```
TRACKS/
  mp3/
    0001.mp3
    0002.mp3
```

### macOS: the hidden file problem

This is the third thing that will get you, and it's invisible in Finder.

When macOS copies a file to a FAT card, it quietly writes a second hidden file alongside it named `._0001.mp3`. It holds metadata your Mac cares about and the DFPlayer does not. The problem is that its name starts with the same four digits the module matches on, so the DFPlayer may play that 4 KB of junk instead of your audio. It sounds like squeaks and static.

Copy from Terminal with the `-X` flag, which tells macOS not to write those files at all:

```bash
cp -X ~/Desktop/0001.mp3 "/Volumes/TRACKS/mp3/0001.mp3"
```

If you already copied with Finder or plain `cp`, clean up afterward:

```bash
dot_clean -m "/Volumes/TRACKS"
ls -la "/Volumes/TRACKS/mp3/"
```

That listing should show only your numbered files and nothing beginning with `._`.

### Windows and Linux

Nothing special. Drag the files in.

### Eject properly, every time

On any platform, eject the card rather than pulling it out. Copying a file only queues the write, and the system finishes it when you eject. Yank the card early and you get a file that looks like it copied but didn't, which then sends you off debugging wiring that was fine all along.

- **macOS:** `diskutil eject "/Volumes/TRACKS"`, or drag to the Trash, or Cmd+E
- **Windows:** Safely Remove Hardware in the system tray

## Step 4: Play them

`playMp3Folder(1)` plays `0001.mp3`, `playMp3Folder(2)` plays `0002.mp3`, and so on.

```cpp
player.playMp3Folder(2);   // plays /mp3/0002.mp3
```

You may see other tutorials use `player.play(1)` with files sitting loose in the card's root. Avoid it. That command numbers tracks by **the order they were written to the card**, not by filename, so hidden system files get counted as tracks and everything shifts by one. Using the `mp3` folder and `playMp3Folder()` looks files up by name and sidesteps the whole mess.

## If something's wrong

| What you hear | What's usually wrong |
|---|---|
| Chipmunk or dolphin speed | The file is mono. Re-export as stereo |
| Squeaks, static, garbage | A `._` hidden file on the card. Clean it with `dot_clean` |
| Nothing at all, blue light never comes on | Card not recognized. Check it's FAT32 or FAT16 and 32 GB or under |
| Blue light blinks but silence | Not the card. Check the speaker wiring |
| Old audio still playing | The card was pulled without ejecting, so the copy never finished |
| Crunchy or distorted | Lower the volume in code. 30 is the top of the range, not the top of the clean range |

Worth knowing: when a symptom survives swapping the file **and** the card **and** the module, stop looking at the audio. It's almost always power. That's the single most useful thing to remember about this module.
