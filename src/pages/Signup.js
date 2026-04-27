import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../supabase';

const B = {
  sand:      "#F5EFE6",
  sandMid:   "#EDE3D4",
  sandDeep:  "#D9C9B0",
  terra:     "#D4845A",
  terraDark: "#B56840",
  seaMid:    "#5B9EC9",
  seaDeep:   "#2E6DA4",
  ink:       "#3A3226",
  inkMid:    "#6B5D4E",
  inkLight:  "#9A8878",
  white:     "#FFFCF8",
};

const adjectives = ['Swift','Brave','Clever','Bold','Bright','Calm','Keen','Wise','Wild','Quiet'];
const nouns = ['Penguin','Narrator','Scribe','Author','Dreamer','Writer','Poet','Falcon','Otter','Fox'];
const generateUsername = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${adj}${noun}${num}`;
};

export default function Signup() {
  const { state } = useLocation();
  const isMinor = state?.isMinor ?? false;
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState(isMinor ? 'minor' : 'standard');
  const [username] = useState(gene