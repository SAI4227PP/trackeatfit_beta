import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Text, View } from 'react-native';

const CustomButton = ({title,handlePress,containerStyles,textStyles,isLoading}) => {
    return (
        <TouchableOpacity 
        onPress={handlePress}
        activeOpacity={0.7}
        className={`bg-oliveDrab 
        rounded-xl min-h-[62px] justify-center items-center ${containerStyles} ${isLoading ? 'opacity-50' : ''}`}
           disabled={isLoading}>
            <Text className={`text-black font-semibold text-lg ${textStyles}`}>{title}</Text>
        </TouchableOpacity>
    );
}


export default CustomButton;
