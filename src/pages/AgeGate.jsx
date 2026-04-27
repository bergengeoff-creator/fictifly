import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const B = {
  sand: "#F5EFE6",
  sandMid: "#EDE3D4",
  sandDeep: "#D9C9B0",
  terra: "#D4845A",
  terraDark: "#B56840",
  seaMid: "#5B9EC9",
  seaDeep: "#2E6DA4",
  ink: "#3A3226",
  inkMid: "#6B5D4E",
  inkLight: "#9A8878",
  white: "#FFFCF8",
};

export default function AgeGate() {
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!selected) {
      setError('Please select an option to contin