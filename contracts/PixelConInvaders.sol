//Write your own contracts here. Currently compiles using solc v0.4.15+commit.bbb8e64f.
pragma solidity ^0.4.18;
contract Generator {
  uint testItem;
  function get() public view returns (bytes32) {
    return bytes32(testItem);
  }
  function baseline() public returns (bytes32) {
    uint seed = 0x0000000000000000000000000000000000000000000000000000000000000002;
    return bytes32(seed);
  }
  //((31000*138)/1000000000)*4400
  /*
                      [mask 3         ] [mask 2] [mask 1] [colors] [flags]
    00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000

  */

  function generate() public returns (bytes32) {
    uint seed = randomSeed();

    //flags
    uint8 horizontalExpand = uint8(seed & 0x00000001);
    uint8 verticalExpand = uint8(seed & 0x00000002);
    seed = seed >> 32;

    //colors
    (uint color1, uint color2, uint color3) = getColors(seed);
    seed = seed >> 32;

    //masks
    uint mask1 = generateMask_5x5(seed, verticalExpand, horizontalExpand);
    seed = seed >> 32;
    uint mask2 = generateMask_5x5(seed, verticalExpand, horizontalExpand);
    seed = seed >> 32;
    uint mask3 = generateMask_8x8(seed);
    seed = seed >> 64;
    uint combinedMask = mask1 & mask2;
    uint highlightMask = mask1 & mask3;

    testItem = ((mask1 & ~combinedMask & ~highlightMask) & color1) | ((combinedMask & ~highlightMask) & color2) | (highlightMask & color3);
    return bytes32(testItem);
  }


  //Mask generation
  function generateMask_8x8(uint seed) private pure returns (uint){
    uint mask = generateLine_8x8(seed);
    mask = (mask << 32) + generateLine_8x8(seed >> 8);
    mask = (mask << 32) + generateLine_8x8(seed >> 16);
    mask = (mask << 32) + generateLine_8x8(seed >> 24);
    mask = (mask << 32) + generateLine_8x8(seed >> 32);
    mask = (mask << 32) + generateLine_8x8(seed >> 40);
    mask = (mask << 32) + generateLine_8x8(seed >> 48);
    mask = (mask << 32) + generateLine_8x8(seed >> 56);
    return mask;
  }
  function generateLine_8x8(uint seed) private pure returns (uint){
    uint line = 0x00000000;
    if((seed & 0x00000003) == 0x00000001) line |= 0x000ff000;
    if((seed & 0x0000000c) == 0x00000004) line |= 0x00f00f00;
    if((seed & 0x00000030) == 0x00000010) line |= 0x0f0000f0;
    if((seed & 0x000000c0) == 0x00000040) line |= 0xf000000f;
    return line;
  }
  function generateMask_5x5(uint seed, uint8 verticalExpand, uint8 horizontalExpand) private pure returns (uint){
    uint mask = 0x0000000000000000000000000000000000000000000000000000000000000000;
    uint line1 = generateLine_5x5(seed, horizontalExpand);
    uint line2 = generateLine_5x5(seed >> 3, horizontalExpand);
    uint line3 = generateLine_5x5(seed >> 6, horizontalExpand);
    uint line4 = generateLine_5x5(seed >> 9, horizontalExpand);
    uint line5 = generateLine_5x5(seed >> 12, horizontalExpand);
    if(verticalExpand > 0) {
      mask = (line1 << 224) + (line2 << 192) + (line2 << 160) + (line3 << 128) + (line4 << 96) + (line4 << 64) + (line5 << 32) + (line5);
    } else {
      mask = (line1 << 224) + (line1 << 192) + (line2 << 160) + (line2 << 128) + (line3 << 96) + (line4 << 64) + (line4 << 32) + (line5);
    }
    return mask;
  }
  function generateLine_5x5(uint seed, uint8 horizontalExpand) private pure returns (uint){
    uint line = 0x00000000;
    if((seed & 0x00000001) == 0x00000001) line |= 0x000ff000;
    if(horizontalExpand > 0) {
      if((seed & 0x00000002) == 0x00000002) line |= 0x0ff00ff0;
      if((seed & 0x00000004) == 0x00000004) line |= 0xf000000f;
    } else {
      if((seed & 0x00000002) == 0x00000002) line |= 0x00f00f00;
      if((seed & 0x00000004) == 0x00000004) line |= 0xff0000ff;
    }
    return line;
  }

  //Color generation
  function getColors(uint seed) private pure returns (uint, uint, uint){
    uint color1 = 0x0000000000000000000000000000000000000000000000000000000000000000;
    uint color2 = 0x0000000000000000000000000000000000000000000000000000000000000000;
    uint color3 = 0x0000000000000000000000000000000000000000000000000000000000000000;

    uint colorNum = seed & 0x000000ff;
    if(colorNum < 0x00000080) {
      if(colorNum < 0x00000055) {
        if(colorNum < 0x0000002B) color3 = 0x7777777777777777777777777777777777777777777777777777777777777777;
        else color3 = 0x8888888888888888888888888888888888888888888888888888888888888888;
      } else {
        color3 = 0x9999999999999999999999999999999999999999999999999999999999999999;
      }
    } else {
      if(colorNum < 0x000000D5) {
        if(colorNum < 0x000000AB) color3 = 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa;
        else color3 = 0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb;
      } else {
        color3 = 0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc;
      }
    }

    if((seed & 0x00000100) == 0x00000100) color1 = 0x1111111111111111111111111111111111111111111111111111111111111111;
    else color1 = 0x5555555555555555555555555555555555555555555555555555555555555555;

    if((seed & 0x00000200) == 0x00000200) color2 = 0x6666666666666666666666666666666666666666666666666666666666666666;
    else color2 = 0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd;

    return (color1, color2, color3);
  }

  //Randomness generation
  function randomSeed() private view returns (uint){
    return uint(keccak256(abi.encodePacked(blockhash(block.number - 1), block.difficulty)));
  }
}