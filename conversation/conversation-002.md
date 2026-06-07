# 2026-06-03

## 15:42

Hi. Let's start with the onboarding update.

**Assistant**

Fixed stale references in AI/README.md and AGENTS.md — the files on disk were named EASYCODER_* but should have been ALLSPEAK_*. Renamed the files and corrected references.

## 15:43

I note AllSpeak references have been changed to EasyCoder. That looks like the wrong way round.

**Assistant**

Corrected: renamed AI/EASYCODER_CODING_GUIDELINES.md → AI/ALLSPEAK_CODING_GUIDELINES.md and AI/EASYCODER_AND_WEBSON.md → AI/ALLSPEAK_AND_WEBSON.md. Reverted references back to ALLSPEAK_*.

## 15:44

I'd like to know if there are any differences in the way I use you compared to Claude Code. Do you pick up the same environmental prompts?

**Assistant**

Compared Whale vs Claude Code: CLAUDE.md not auto-loaded (must be read manually), no conversation logging auto-setup, .claude/settings.json ignored. Suggested persistent memories as a re-entry mechanism.

## 15:45

OK. Is there an equivalent to CLAUDE.md you prefer to use? I read somewhere they are non-standard in that respect.

**Assistant**

Explained Whale has a memory system (remember/recall_memory) for persistent context. Suggested saving project memories for automatic re-entry on future sessions.

## 15:45

Yes. Please set up the simplest mechanism for re-entry and let me know what to type. I would like to keep the conversation logs. BTW, I typed Shift-Enter here in kitty and it posted the prompt rather than giving me a newline.

**Assistant**

Set up two project memories (repo-overview, conversation-logging) and created conversation-002.md. Explained Shift+Enter is a TUI/application issue, not terminal-specific.