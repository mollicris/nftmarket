"use client";

import { useEffect } from "react";
import { useState } from "react";
import type { NextPage } from "next";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState<File>();
  const server = process.env.NEXT_PUBLIC_SERVER_URL;

  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract({
    contractName: "YourContract",
  });

  const handleFileChange = (event: any) => {
    // Obtener el primer archivo seleccionado
    const file = event.target.files[0];
    console.log(file);
    setSelectedFile(file);
  };

  async function upload() {
    const url = "https://uploads.pinata.cloud/v3/files";
    const form = new FormData();
    form.append("network", "public");

    form.append("file", selectedFile as Blob, selectedFile?.name);

    const options = {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.NEXT_PUBLIC_PINATA_JWT,
      },
      body: form,
    };

    //options.body = form;

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      console.log(data);
      const resp = uploadMetadataToPinata(data.data.cid, data.data.name.replace(/\.jpg$/, ".json"), "test");
      // try {
      //   await writeYourContractAsync({
      //     functionName: "safeMint",
      //       args: ["adrress",resp],
      //     });
      //     } catch (e) {
      //        console.error("Error mint image:", e);
      //     }
      console.log(resp);
    } catch (error) {
      console.error(error);
    }
  }

  const options = {
    method: "GET",
    headers: {
      Authorization: "Bearer " + process.env.NEXT_PUBLIC_PINATA_JWT,
    },
  };

  async function uploadMetadataToPinata(imageHash: string, name: string, description: string) {
    const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

    // Construye el objeto de metadatos
    const metadata = {
      pinataMetadata: {
        name: name,
        keyvalues: {
          // Puedes añadir metadatos adicionales
          creator: "CMM",
          project: "NFTMARKET",
        },
      },
      pinataContent: {
        description: description,
        image: server + imageHash,
        // más campos estándar de NFT
        name: "NFT de Prueba",
        attributes: [
          {
            trait_type: "Rareza",
            value: "Común",
          },
        ],
      },
    };

    const options = {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.NEXT_PUBLIC_PINATA_JWT,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata), // Convierte el objeto a JSON
    };

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error de Pinata: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log("Subida exitosa:", data);
      console.log("CID del JSON:", data.IpfsHash);

      return data.IpfsHash;
    } catch (error) {
      console.error("Error al subir a Pinata:", error);
      throw error;
    }
  }

  useEffect(() => {
    // This effect runs once when the component mounts
    const getFiles = () => {
      fetch("https://api.pinata.cloud/v3/files/public", options)
        .then(response => response.json())
        .then(response => {
          setFiles(response.data.files);
          console.log(response.data.files);
        })
        .catch(err => console.error(err));
    };

    getFiles();
  }, []);

  return (
    <>
      Address:
      <Address address={connectedAddress}></Address>
      Subir NFT
      <input type="file" className="file-input file-input-ghost" onChange={handleFileChange} />
      <div></div>
      <button className="btn" onClick={() => upload()}>
        UpLoad
      </button>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {files.map((file: IPFSFile) => (
          <div className="bg-base-200 p-4 rounded-box" key={file.cid}>
            <div className="card bg-base-100 w-96 shadow-sm" key={file.cid}>
              {file.mime_type?.startsWith("image/") && (
                <>
                  <figure>
                    <img src={`${server}/ipfs/${file.cid}`} alt="Shoes" />
                  </figure>
                  <div className="card-body">
                    <h2 className="card-title">{file.name.replace(/\.jpg$/, "")}</h2>
                    <div className="card-actions justify-end">
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          try {
                            await writeYourContractAsync({
                              functionName: "buyImage",
                              args: [file.cid],
                              value: parseEther("0.01"),
                            });
                          } catch (e) {
                            console.error("Error buying image:", e);
                          }
                        }}
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
export default Home;

interface IPFSFile {
  cid: string;
  mime_type?: string;
  name: string;
  size: number;
}
