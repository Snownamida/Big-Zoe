export interface FruitLevel {
  radius: number;
  fileName: string;
  score: number;
  backgroundColor: string;
  borderColor: string;
}

export const IMG_PATH = 'images/';

export const FRUIT_LEVELS: FruitLevel[] = [
  {
      radius: 18,
      fileName: '崔梓璇01.gif',
      score: 2,
      backgroundColor: '#FFFACD',
      borderColor: '#FFD700'
  }, // 0
  {
      radius: 24,
      fileName: '崔梓璇02.gif',
      score: 4,
      backgroundColor: '#FFA07A',
      borderColor: '#FF4500'
  }, // 1
  {
      radius: 30,
      fileName: '崔梓璇03.gif',
      score: 8,
      backgroundColor: '#FF6347',
      borderColor: '#DC143C'
  }, // 2
  {
      radius: 34,
      fileName: '崔梓璇04.gif',
      score: 16,
      backgroundColor: '#90EE90',
      borderColor: '#3CB371'
  }, // 3
  {
      radius: 42,
      fileName: '崔梓璇05.gif',
      score: 32,
      backgroundColor: '#32CD32',
      borderColor: '#228B22'
  }, // 4
  {
      radius: 52,
      fileName: '崔梓璇06.gif',
      score: 64,
      backgroundColor: '#87CEFA',
      borderColor: '#4682B4'
  }, // 5
  {
      radius: 64,
      fileName: '崔梓璇07.gif',
      score: 128,
      backgroundColor: '#4169E1',
      borderColor: '#191970'
  }, // 6
  {
      radius: 76,
      fileName: '崔梓璇08.gif',
      score: 256,
      backgroundColor: '#9932CC',
      borderColor: '#800080'
  }, // 7
  {
      radius: 88,
      fileName: '崔梓璇09.gif',
      score: 512,
      backgroundColor: '#FFD700',
      borderColor: '#B8860B'
  }, // 8
  {
      radius: 100,
      fileName: '崔梓璇10.gif',
      score: 1024,
      backgroundColor: '#C0C0C0',
      borderColor: '#808080'
  }, // 9
  {
      radius: 115,
      fileName: '崔梓璇11.png',
      score: 2048,
      backgroundColor: '#228B22',
      borderColor: '#3CB371'
  } // 10
];

export const WALL_THICKNESS = 60;
export const SPAWN_Y = 50;
