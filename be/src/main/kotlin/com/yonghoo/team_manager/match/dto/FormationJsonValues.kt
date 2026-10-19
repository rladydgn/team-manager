package com.yonghoo.team_manager.match.dto

import tools.jackson.core.JsonParser
import tools.jackson.core.JsonToken
import tools.jackson.databind.DeserializationContext
import tools.jackson.databind.ValueDeserializer

// Do not silently coerce numeric strings or fractional IDs in these write contracts.
class FormationLongDeserializer : ValueDeserializer<Long>() {
    override fun deserialize(parser: JsonParser, context: DeserializationContext): Long {
        require(parser.currentToken() == JsonToken.VALUE_NUMBER_INT) { "정수 값이 필요합니다." }
        return parser.longValue
    }
}

class FormationStringDeserializer : ValueDeserializer<String>() {
    override fun deserialize(parser: JsonParser, context: DeserializationContext): String {
        require(parser.currentToken() == JsonToken.VALUE_STRING) { "문자열이 필요합니다." }
        return parser.string
    }
}
