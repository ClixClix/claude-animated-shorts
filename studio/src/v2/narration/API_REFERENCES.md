# Official API schema references

The API/docs hosts are blocked by this managed environment's outbound policy. No authenticated
request has been made, because no key is configured and rotation is unconfirmed. Public official
SDK sources were accessible through GitHub and inspected instead.

Official ElevenLabs JS SDK revision inspected: `4df37785f2ad89a89ecf8702513dc9b865be1a03`.

- [Timestamp TTS client](https://github.com/elevenlabs/elevenlabs-js/blob/4df37785f2ad89a89ecf8702513dc9b865be1a03/src/api/resources/textToSpeech/client/Client.ts): `POST /v1/text-to-speech/{voice_id}/with-timestamps`, `output_format` query parameter, JSON request body, `xi-api-key` header.
- [Request schema](https://github.com/elevenlabs/elevenlabs-js/blob/4df37785f2ad89a89ecf8702513dc9b865be1a03/src/api/resources/textToSpeech/client/requests/BodyTextToSpeechFullWithTimestamps.ts): text/model/settings, seed and text normalization. Seed is best-effort, not a deterministic performance guarantee. Language code is not supported for multilingual v2; this adapter does not send it.
- [Voice settings](https://github.com/elevenlabs/elevenlabs-js/blob/4df37785f2ad89a89ecf8702513dc9b865be1a03/src/api/types/VoiceSettings.ts): stability, similarity, style, speaker boost and natural speed. New clone-specific v4 controls are intentionally not sent.
- [Voice setting JSON names](https://github.com/elevenlabs/elevenlabs-js/blob/4df37785f2ad89a89ecf8702513dc9b865be1a03/src/serialization/types/VoiceSettings.ts): `similarity_boost`, `use_speaker_boost`, `speed`.
- [Timestamp response](https://github.com/elevenlabs/elevenlabs-js/blob/4df37785f2ad89a89ecf8702513dc9b865be1a03/src/serialization/types/AudioWithTimestampsResponse.ts): `audio_base64`, `alignment`, `normalized_alignment`.
- [Model metadata](https://github.com/elevenlabs/elevenlabs-js/blob/4df37785f2ad89a89ecf8702513dc9b865be1a03/src/api/types/Model.ts) and [JSON names](https://github.com/elevenlabs/elevenlabs-js/blob/4df37785f2ad89a89ecf8702513dc9b865be1a03/src/serialization/types/Model.ts): TTS/style/boost flags; `maximum_text_length_per_request` replaces deprecated free/subscribed character-limit fields.

Schema inspection does **not** verify this account's voice access, credits, model availability,
voice/model pairing, timestamp quality or pronunciation. The `verify` command and then the
explicitly authorized generation/sample-listening gates establish those facts. Unknown models
and unconfirmed optional capability flags fail closed. No unavailable voice is substituted.
