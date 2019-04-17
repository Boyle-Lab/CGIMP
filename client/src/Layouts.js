import React from "react";
import { View } from "react-native";

const HorizontalSplit = ( {leftSide, rightSide} ) => (
        <View style={{flex: 1, flexDirection: 'row', width: "100%"}}>
        <View style={{ width: "300px", backgroundColor: 'powderblue' }}>{leftSide}</View>
        <View style={{ width: "1000px", alignItems: "center" }}>{rightSide}</View>
        </View>
);

export default HorizontalSplit;
