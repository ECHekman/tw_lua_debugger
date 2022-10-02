#![deny(clippy::all)]

use napi::bindgen_prelude::*;
use napi_derive::napi;

#[macro_use]
extern crate napi_derive;


use std::path::{PathBuf, Path};

use rpfm_lib::packfile::PackFile;
use rpfm_lib::packedfile::DecodedPackedFile;
use rpfm_lib::packedfile::text::{Text, TextType};
use rpfm_lib::packedfile::PackedFileType;

use std::fs::File;
use std::io::prelude::*;

#[napi]
pub struct PackFileHolder
{
    owned_packfile: PackFile,
}


#[napi]
pub fn open_pack_files(paths: Vec<String>, use_lazy_loading: bool, ignore_mods: bool, lock_packfile: bool) -> PackFileHolder
{
    let mut pathsbufs: Vec<PathBuf> = vec![];

    for path in paths.iter() {
        pathsbufs.push(PathBuf::from(path));
    }

    let mut ret_holder = PackFileHolder { owned_packfile: PackFile::default() };
    match PackFile::open_packfiles(&pathsbufs, use_lazy_loading, ignore_mods, lock_packfile)
    {
        Ok(pack_file) => 
        {
            ret_holder.owned_packfile = pack_file;
        }
        Err(_error) =>
        {
            //nothing
        }
    }

    return ret_holder;
}

// Source file interface
#[napi]
impl PackFileHolder
{
    #[napi]
    pub fn get_all_lua_file_paths(&mut self) -> Vec<String>
    {    
        let mut files_vec = Vec::new();
        let packed_files = self.owned_packfile.get_ref_packed_files_by_type(PackedFileType::Text(TextType::Lua), true);

        packed_files.iter().for_each(|x| files_vec.push(x.get_path().join("/")));

        return files_vec;
    }

    #[napi]
    pub fn get_text_file(&mut self, filepath: String) -> String
    {    
        let splits = filepath.split('/').map(str::to_string).collect::<Vec<String>>();

        match self.owned_packfile.get_packed_file_by_path(&splits) {        
            Some(mut x) => match x.decode_return_ref().unwrap_or(&DecodedPackedFile::Unknown) { 
                DecodedPackedFile::Text(data) => return String::from(data.get_ref_contents()),
                _ => return "Text Not Found One".to_string()
            },
            None => return "Text Not Found Two".to_string()
        }
    }
}